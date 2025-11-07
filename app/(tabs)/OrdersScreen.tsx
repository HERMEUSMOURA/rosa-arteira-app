import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getOrdersWithDetails, updateOrderStatus, Order, User, getStoredProductById, StoredProduct } from "../../hooks/storage";

type OrderWithDetails = Order & { 
  user?: User;
  itemsWithDetails?: Array<{
    id: string;
    quantity: number;
    product?: StoredProduct;
  }>;
};

const { width } = Dimensions.get('window');

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'shipped' | 'delivered'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const ordersData = await getOrdersWithDetails();
      
      // ✅ CARREGAR INFORMAÇÕES COMPLETAS DOS PRODUTOS
      const ordersWithProductDetails = await Promise.all(
        ordersData.map(async (order) => {
          const itemsWithDetails = await Promise.all(
            order.items.map(async (item) => {
              const product = await getStoredProductById(item.id);
              return {
                id: item.id,
                quantity: item.quantity,
                product: product || undefined
              };
            })
          );
          
          return {
            ...order,
            itemsWithDetails
          };
        })
      );
      
      // Ordenar por data (mais recentes primeiro)
      ordersWithProductDetails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(ordersWithProductDetails);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      Alert.alert("Erro", "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // ✅ Toggle para expandir/recolher itens
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // ✅ Filtrar pedidos
  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  // ✅ Atualizar status do pedido
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        await loadOrders(); // Recarregar lista
        Alert.alert("Sucesso", `Pedido atualizado para: ${getStatusText(newStatus)}`);
      } else {
        Alert.alert("Erro", "Não foi possível atualizar o pedido.");
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert("Erro", "Erro ao atualizar pedido.");
    }
  };

  // ✅ Texto do status
  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      'pending': 'Pendente',
      'preparing': 'Preparando',
      'shipped': 'Enviado',
      'delivered': 'Entregue'
    };
    return statusMap[status];
  };

  // ✅ Texto abreviado para os filtros
  const getFilterText = (status: string) => {
    const textMap = {
      'all': 'Todos',
      'pending': 'Pendente',
      'preparing': 'Preparando', 
      'shipped': 'Enviado',
      'delivered': 'Entregue'
    };
    return textMap[status as keyof typeof textMap];
  };

  // ✅ Cor do status (usando a mesma paleta do Dashboard)
  const getStatusColor = (status: Order['status']) => {
    const colorMap = {
      'pending': '#C4A89B',    // Bege rosado
      'preparing': '#8BA6D9',  // Azul suave
      'shipped': '#D9A59A',    // Rosa arteira
      'delivered': '#7BBF93'   // Verde suave
    };
    return colorMap[status];
  };

  // ✅ Formatar data
const formatDate = (dateString: string) => {
  try {
    // Tenta converter a string de data
    const date = new Date(dateString);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      // Se não for válida, tenta alternativas
      if (dateString.includes('/')) {
        // Formato brasileiro: DD/MM/YYYY HH:MM
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        const correctedDate = new Date(`${year}-${month}-${day}T${timePart || '00:00'}`);
        
        if (!isNaN(correctedDate.getTime())) {
          return correctedDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      // Se ainda não conseguir, retorna a string original ou mensagem
      return 'Data não disponível';
    }
    
    // Se a data for válida, formata normalmente
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'String original:', dateString);
    return 'Data inválida';
  }
};

  // ✅ Formatar valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* ✅ HEADER - Mesmo estilo do Dashboard */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestão de Pedidos</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={refreshing ? "#C4A89B" : "#D9A59A"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ FILTROS - Layout melhorado */}
      <View style={styles.filtersWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {['all', 'pending', 'preparing', 'shipped', 'delivered'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.filterButtonActive
              ]}
              onPress={() => setFilter(status as any)}
            >
              <Text 
                style={[
                  styles.filterText,
                  filter === status && styles.filterTextActive
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getFilterText(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ CONTADOR */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'} 
            {filter !== 'all' && ` ${getStatusText(filter)}`}
          </Text>
        </View>

        {/* ✅ LISTA DE PEDIDOS */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#C4A89B" />
            <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Ainda não há pedidos no sistema' 
                : `Nenhum pedido com status "${getStatusText(filter)}"`}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* ✅ HEADER DO PEDIDO - AGORA CLICÁVEL */}
              <TouchableOpacity 
                style={styles.orderHeader}
                onPress={() => toggleOrderExpansion(order.id)}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Pedido #{order.id.slice(-6)}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                  <Ionicons 
                    name={expandedOrderId === order.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#886364" 
                  />
                </View>
              </TouchableOpacity>

              {/* ✅ INFO DO CLIENTE */}
              <View style={styles.customerInfo}>
                <Ionicons name="person-outline" size={16} color="#886364" />
                <Text style={styles.customerText} numberOfLines={1}>
                  {order.customerName || order.user?.name || 'Cliente'} • {order.customerEmail || order.user?.email}
                </Text>
              </View>

              {/* ✅ ITENS DO PEDIDO - VERSÃO MELHORADA */}
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>
                  Itens ({order.itemsWithDetails?.length || 0}):
                </Text>
                
                {/* ✅ MOSTRAR TODOS OS ITENS QUANDO EXPANDIDO */}
                {expandedOrderId === order.id ? (
                  // ✅ MODO EXPANDIDO - TODOS OS ITENS COM DETALHES
                  <View style={styles.expandedItems}>
                    {order.itemsWithDetails?.map((item, index) => (
                      <View key={index} style={styles.itemDetailRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={2}>
                            {item.product?.name || `Produto #${item.id.slice(-6)}`}
                          </Text>
                          <Text style={styles.itemPrice}>
                            {formatCurrency(item.product?.price || 0)} cada
                          </Text>
                        </View>
                        <View style={styles.itemQuantity}>
                          <Text style={styles.quantityText}>
                            {item.quantity}x
                          </Text>
                          <Text style={styles.itemTotal}>
                            {formatCurrency((item.product?.price || 0) * item.quantity)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  // ✅ MODO COMPACTO - PRIMEIROS 2 ITENS
                  <View style={styles.compactItems}>
                    {order.itemsWithDetails?.slice(0, 2).map((item, index) => (
                      <Text key={index} style={styles.itemText} numberOfLines={1}>
                        • {item.quantity}x {item.product?.name || `Produto #${item.id.slice(-6)}`}
                      </Text>
                    ))}
                    {order.itemsWithDetails && order.itemsWithDetails.length > 2 && (
                      <Text style={styles.moreItemsText}>
                        • +{order.itemsWithDetails.length - 2} outros itens - Toque para ver todos
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* ✅ TOTAL E PAGAMENTO */}
              <View style={styles.orderFooter}>
                <View style={styles.orderTotal}>
                  <Text style={styles.totalText}>{formatCurrency(order.total)}</Text>
                  <Text style={styles.paymentText}>{order.paymentMethod}</Text>
                </View>
                
                {/* ✅ AÇÕES - PRÓXIMO STATUS */}
                <View style={styles.actionsContainer}>
                  {order.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#8BA6D9' }]}
                      onPress={() => handleUpdateStatus(order.id, 'preparing')}
                    >
                      <Text style={styles.actionText}>Preparar</Text>
                    </TouchableOpacity>
                  )}
                  
                  {order.status === 'preparing' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#D9A59A' }]}
                      onPress={() => handleUpdateStatus(order.id, 'shipped')}
                    >
                      <Text style={styles.actionText}>Enviar</Text>
                    </TouchableOpacity>
                  )}
                  
                  {order.status === 'shipped' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#7BBF93' }]}
                      onPress={() => handleUpdateStatus(order.id, 'delivered')}
                    >
                      <Text style={styles.actionText}>Entregue</Text>
                    </TouchableOpacity>
                  )}
                  
                  {order.status === 'delivered' && (
                    <Text style={styles.completedText}>✓ Finalizado</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#C4A89B',
  },
  headerWrapper: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: '#D9A59A' 
  },
  refreshButton: {
    padding: 4,
  },
  filtersWrapper: {
    backgroundColor: '#f4f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D0C4',
    maxHeight: 60,
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: '100%',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#D9A59A',
  },
  filterText: {
    fontSize: 14,
    color: '#886364',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  counterContainer: {
    marginBottom: 16,
  },
  counterText: {
    fontSize: 16,
    color: '#886364',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#181111',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#886364',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f4f0f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#886364',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerText: {
    fontSize: 14,
    color: '#886364',
    marginLeft: 6,
    flex: 1,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181111',
    marginBottom: 8,
  },
  // ✅ NOVOS ESTILOS PARA ITENS EXPANDIDOS
  expandedItems: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    color: '#181111',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#886364',
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 14,
    color: '#181111',
    fontWeight: '600',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    color: '#D9A59A',
    fontWeight: '600',
  },
  compactItems: {
    // Estilo para modo compacto
  },
  itemText: {
    fontSize: 13,
    color: '#886364',
    marginLeft: 8,
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 13,
    color: '#C4A89B',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    flex: 1,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 2,
  },
  paymentText: {
    fontSize: 12,
    color: '#886364',
  },
  actionsContainer: {
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  completedText: {
    fontSize: 14,
    color: '#7BBF93',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});