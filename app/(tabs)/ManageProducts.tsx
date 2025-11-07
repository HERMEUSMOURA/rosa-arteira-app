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
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { 
  getProductsWithHistory, 
  deleteProduct, 
  StoredProduct,
  getTopSellingProducts,
  getRecentlySoldProducts 
} from "../../hooks/storage";

export default function ManageProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'inStock' | 'outOfStock' | 'topSelling'>('all');
  const [selectedProduct, setSelectedProduct] = useState<StoredProduct | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const loadProducts = async () => {
    try {
      let productsData: StoredProduct[] = [];
      
      switch (filter) {
        case 'topSelling':
          productsData = await getTopSellingProducts();
          break;
        case 'inStock':
          productsData = await getProductsWithHistory();
          productsData = productsData.filter(p => (p.stock || 0) > 0);
          break;
        case 'outOfStock':
          productsData = await getProductsWithHistory();
          productsData = productsData.filter(p => p.stock === 0);
          break;
        default:
          productsData = await getProductsWithHistory();
      }
      
      // Aplicar busca se houver query
      if (searchQuery) {
        productsData = productsData.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert("Erro", "Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // ✅ Excluir produto
  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      "Excluir Produto",
      `Tem certeza que deseja excluir "${productName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteProduct(productId);
              if (success) {
                await loadProducts();
                Alert.alert("Sucesso", "Produto excluído com sucesso!");
              } else {
                Alert.alert("Erro", "Não foi possível excluir o produto.");
              }
            } catch (error) {
              console.error('Erro ao excluir produto:', error);
              Alert.alert("Erro", "Erro ao excluir produto.");
            }
          },
        },
      ]
    );
  };

  // ✅ Abrir histórico do produto
  const openProductHistory = (product: StoredProduct) => {
    setSelectedProduct(product);
    setHistoryModalVisible(true);
  };

  // ✅ Formatar data
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Data inválida";
    }
  };

  // ✅ Formatar valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // ✅ Obter texto do histórico
  const getHistoryText = (history: any) => {
    switch (history.type) {
      case 'created':
        return 'Produto cadastrado';
      case 'sold':
        return `Vendido ${history.details?.quantity}x`;
      case 'updated':
        return 'Produto atualizado';
      case 'stock_updated':
        return `Estoque ajustado`;
      default:
        return 'Ação realizada';
    }
  };

  // ✅ Estatísticas
  const stats = {
    total: products.length,
    inStock: products.filter(p => (p.stock || 0) > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalSold: products.reduce((sum, p) => sum + (p.totalSold || 0), 0),
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gerenciar Produtos</Text>
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

      {/* BARRA DE PESQUISA */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#886364" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#C4A89B"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#C4A89B" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTROS */}
      <View style={styles.filtersWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {[
            { key: 'all', label: 'Todos' },
            { key: 'inStock', label: 'Em Estoque' },
            { key: 'outOfStock', label: 'Sem Estoque' },
            { key: 'topSelling', label: 'Mais Vendidos' }
          ].map((filterItem) => (
            <TouchableOpacity
              key={filterItem.key}
              style={[
                styles.filterButton,
                filter === filterItem.key && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterItem.key as any)}
            >
              <Text 
                style={[
                  styles.filterText,
                  filter === filterItem.key && styles.filterTextActive
                ]}
              >
                {filterItem.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CARDS DE ESTATÍSTICAS */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.inStock}</Text>
          <Text style={styles.statLabel}>Em Estoque</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>Sem Estoque</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalSold}</Text>
          <Text style={styles.statLabel}>Vendidos</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CONTADOR */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {products.length} {products.length === 1 ? 'produto' : 'produtos'} 
            {searchQuery && ` encontrados`}
            {filter !== 'all' && ` • ${filter === 'topSelling' ? 'Mais Vendidos' : filter === 'inStock' ? 'Em Estoque' : 'Sem Estoque'}`}
          </Text>
        </View>

        {/* LISTA DE PRODUTOS */}
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#C4A89B" />
            <Text style={styles.emptyText}>
              {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? "Tente buscar com outros termos" 
                : "Os produtos aparecerão aqui quando forem cadastrados"}
            </Text>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              {/* INFO DO PRODUTO */}
              <View style={styles.productMain}>
                {product.images && product.images.length > 0 ? (
                  <View style={styles.productImage}>
                    <Text style={styles.productImageText}>🖼️</Text>
                  </View>
                ) : (
                  <View style={[styles.productImage, styles.noImage]}>
                    <Text style={styles.productImageText}>📦</Text>
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatCurrency(product.price)}
                  </Text>
                  <Text style={styles.productCategory}>
                    {product.category} • Estoque: {product.stock || 0}
                  </Text>
                  <Text style={styles.productSales}>
                    {product.totalSold || 0} vendidos • 
                    Cadastrado em: {formatDate(product.createdAt).split(' ')[0]}
                  </Text>
                </View>
              </View>

              {/* AÇÕES */}
              <View style={styles.productActions}>
                <View style={styles.actionButtons}>
                  {/* BOTÃO HISTÓRICO */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.historyButton]}
                    onPress={() => openProductHistory(product)}
                  >
                    <Ionicons name="time-outline" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Histórico</Text>
                  </TouchableOpacity>

                  {/* BOTÃO EDITAR */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => router.push(`/(tabs)/CadProdScreen?edit=${product.id}`)}
                  >
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>

                  {/* BOTÃO EXCLUIR */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteProduct(product.id, product.name)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL DE HISTÓRICO */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Histórico - {selectedProduct?.name}
              </Text>
              <TouchableOpacity 
                onPress={() => setHistoryModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#886364" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedProduct?.history && selectedProduct.history.length > 0 ? (
                selectedProduct.history.map((history, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={[
                      styles.historyIcon,
                      { backgroundColor: 
                        history.type === 'created' ? '#4CAF50' :
                        history.type === 'sold' ? '#FF9800' :
                        history.type === 'updated' ? '#2196F3' : '#9C27B0'
                      }
                    ]}>
                      <Ionicons 
                        name={
                          history.type === 'created' ? 'add-circle' :
                          history.type === 'sold' ? 'cart' :
                          history.type === 'updated' ? 'pencil' : 'archive'
                        } 
                        size={16} 
                        color="#fff" 
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyText}>
                        {getHistoryText(history)}
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDate(history.date)}
                      </Text>
                      {history.details?.quantity && (
                        <Text style={styles.historyDetail}>
                          Quantidade: {history.details.quantity}
                        </Text>
                      )}
                      {history.details?.price && (
                        <Text style={styles.historyDetail}>
                          Preço: {formatCurrency(history.details.price)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyHistory}>
                  Nenhum histórico registrado para este produto
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f0f0',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8D0C4',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#181111',
    paddingVertical: 4,
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
    minWidth: 100,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f4f0f0',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#886364',
    textAlign: 'center',
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
  productCard: {
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
  productMain: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#D9A59A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noImage: {
    backgroundColor: '#8BA6D9',
  },
  productImageText: {
    fontSize: 20,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D9A59A',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#886364',
    marginBottom: 2,
  },
  productSales: {
    fontSize: 11,
    color: '#C4A89B',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  historyButton: {
    backgroundColor: '#8BA6D9',
  },
  editButton: {
    backgroundColor: '#7BBF93',
  },
  deleteButton: {
    backgroundColor: '#C4A89B',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D9A59A',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#181111',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  historyDetail: {
    fontSize: 12,
    color: '#888',
  },
  emptyHistory: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
});