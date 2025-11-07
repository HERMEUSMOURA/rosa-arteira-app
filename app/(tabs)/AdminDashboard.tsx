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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { getAdminStats } from "../../hooks/storage";
import { SafeAreaView } from '../../components/SafeAreaView';

type Stats = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  pendingOrders: number;
  preparingOrders: number;
  availableProducts: number;
  outOfStockProducts: number;
};

export default function AdminDashboard() {
  const navigation = useNavigation<any>();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const statsData = await getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      Alert.alert("Erro", "Não foi possível carregar os dados do dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  // ✅ FORMATAR VALOR EM REAIS
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
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* ✅ HEADER */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard Admin</Text>
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

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.content}
      >
        {/* ✅ CARDS DE ESTATÍSTICAS */}
        <View style={styles.statsGrid}>
          {/* VENDAS */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0F8F4' }]}>
              <Ionicons name="cash-outline" size={24} color="#7BBF93" />
            </View>
            <Text style={styles.statValue}>
              {stats ? formatCurrency(stats.totalSales) : 'R$ 0,00'}
            </Text>
            <Text style={styles.statLabel}>Total em Vendas</Text>
          </View>

          {/* PEDIDOS PENDENTES */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F8F4F0' }]}>
              <Ionicons name="time-outline" size={24} color="#D9A59A" />
            </View>
            <Text style={styles.statValue}>{stats?.pendingOrders || 0}</Text>
            <Text style={styles.statLabel}>Pedidos Pendentes</Text>
          </View>

          {/* PRODUTOS */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F4F8FF' }]}>
              <Ionicons name="cube-outline" size={24} color="#8BA6D9" />
            </View>
            <Text style={styles.statValue}>{stats?.totalProducts || 0}</Text>
            <Text style={styles.statLabel}>Produtos</Text>
          </View>

          {/* USUÁRIOS */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F8F0F8' }]}>
              <Ionicons name="people-outline" size={24} color="#C4A89B" />
            </View>
            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Usuários</Text>
          </View>
        </View>

        {/* ✅ BOTÕES DE AÇÃO RÁPIDA */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            {/* VER PEDIDOS */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("OrdersScreen")}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="list-outline" size={28} color="#D9A59A" />
              </View>
              <Text style={styles.actionText}>Ver Pedidos</Text>
              <Text style={styles.actionSubtext}>
                {stats?.pendingOrders || 0} pendentes
              </Text>
            </TouchableOpacity>

            {/* GERENCIAR PRODUTOS */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("ManageProducts")}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="create-outline" size={28} color="#C4A89B" />
              </View>
              <Text style={styles.actionText}>Gerenciar Produtos</Text>
              <Text style={styles.actionSubtext}>
                {stats?.availableProducts || 0} disponíveis
              </Text>
            </TouchableOpacity>

            {/* GERENCIAR USUÁRIOS */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("ManageUsers")}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="people-outline" size={28} color="#8BA6D9" />
              </View>
              <Text style={styles.actionText}>Gerenciar Usuários</Text>
              <Text style={styles.actionSubtext}>
                {stats?.totalUsers || 0} cadastrados
              </Text>
            </TouchableOpacity>

            {/* RELATÓRIOS */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert("Em breve", "Relatórios detalhados em breve!")}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="document-text-outline" size={28} color="#7BBF93" />
              </View>
              <Text style={styles.actionText}>Relatórios</Text>
              <Text style={styles.actionSubtext}>Em breve</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ STATUS DO ESTOQUE */}
        <View style={styles.stockSection}>
          <Text style={styles.sectionTitle}>Status do Estoque</Text>
          <View style={styles.stockInfo}>
            <View style={styles.stockItem}>
              <Text style={styles.stockNumber}>{stats?.availableProducts || 0}</Text>
              <Text style={styles.stockLabel}>Disponíveis</Text>
            </View>
            <View style={styles.stockDivider} />
            <View style={styles.stockItem}>
              <Text style={[styles.stockNumber, styles.outOfStock]}>
                {stats?.outOfStockProducts || 0}
              </Text>
              <Text style={styles.stockLabel}>Esgotados</Text>
            </View>
          </View>
        </View>

        {/* ✅ RESUMO ADICIONAL */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumo do Dia</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="cart-outline" size={20} color="#C4A89B" />
              <Text style={styles.summaryText}>{stats?.totalOrders || 0} pedidos hoje</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up-outline" size={20} color="#7BBF93" />
              <Text style={styles.summaryText}>{stats?.preparingOrders || 0} em preparação</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f4f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#886364',
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f4f0f0',
    alignItems: 'center',
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181111',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#886364',
    textAlign: 'center',
  },
  stockSection: {
    marginBottom: 24,
  },
  stockInfo: {
    flexDirection: 'row',
    backgroundColor: '#f4f0f0',
    borderRadius: 12,
    padding: 16,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7BBF93',
    marginBottom: 4,
  },
  outOfStock: {
    color: '#C4A89B',
  },
  stockLabel: {
    fontSize: 12,
    color: '#886364',
  },
  stockDivider: {
    width: 1,
    backgroundColor: '#E8D0C4',
    marginHorizontal: 16,
  },
  summarySection: {
    marginBottom: 40,
  },
  summaryGrid: {
    backgroundColor: '#f4f0f0',
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#886364',
    marginLeft: 8,
  },
});