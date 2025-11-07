import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { getProducts } from "../../hooks/storage";
import { initialProducts } from "../../constants/products";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../hooks/useAuth";

// ✅ CATEGORIAS PARA FILTRO
const CATEGORIES = [
  { label: "Todos", value: "all", icon: "📦" },
  { label: "Camisas", value: "camisa", icon: "👕" },
  { label: "Blusas", value: "blusa", icon: "👚" },
  { label: "Artesanato", value: "artesanato", icon: "🛠️" },
  { label: "Calças", value: "calca", icon: "👖" },
  { label: "Outros", value: "outros", icon: "📦" },
];

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  images?: string[];
  image?: any;
  stock?: number;
};

export default function ProdScreen() {
  const navigation = useNavigation<any>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // load stored user products + initial products
  const loadProducts = async () => {
    try {
      const stored = await getProducts();
      
      const convertedStored = stored.map(product => ({
        ...product,
        images: product.images || (product.image ? [product.image] : [])
      }));

      setProducts([...initialProducts, ...convertedStored]);
    } catch (e) {
      console.error("Erro ao carregar produtos", e);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadProducts);
    return unsub;
  }, [navigation]);

  // ✅ FUNÇÃO PARA NAVEGAR PARA CADASTRO (apenas admin)
  const handleNavigateToCadastro = () => {
    navigation.navigate("CadProdScreen");
  };

  // ✅ FUNÇÃO DE FILTRO MELHORADA
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = 
      selectedCategory === "all" || 
      product.category === selectedCategory ||
      (!product.category && selectedCategory === "outros");

    return matchesSearch && matchesCategory;
  });

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard product={item} />
  );

  // ✅ MOSTRAR LOADING ENQUANTO VERIFICA AUTENTICAÇÃO
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* ✅ HEADER CORRIGIDO */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expositor</Text>

          <View style={styles.headerButtons}>
            {/* ✅ BOTÃO "+" APENAS PARA ADMIN - usuário comum não vê */}
            {isAdmin && (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleNavigateToCadastro}
              >
                <Feather name="plus" size={24} color={'#D9A59A'} />
              </TouchableOpacity>
            )}

            {/* ✅ BOTÃO CARRINHO SEMPRE VISÍVEL */}
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate("CartScreen")}
            >
              <Feather name="shopping-cart" size={24} color={'#D9A59A'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ✅ BARRA DE PESQUISA */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={'#886364'} style={{ marginRight: 8 }} />
        <TextInput 
          placeholder="Buscar produtos..." 
          style={styles.searchInput} 
          value={search} 
          onChangeText={setSearch} 
          placeholderTextColor="#886364"
        />
      </View>

      {/* ✅ FILTROS DE CATEGORIA */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryButton,
                selectedCategory === category.value && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Text style={[
                styles.categoryIcon,
                selectedCategory === category.value && styles.categoryIconSelected
              ]}>
                {category.icon}
              </Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.value && styles.categoryTextSelected
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ✅ CONTADOR DE PRODUTOS (SEM INDICADOR DE USUÁRIO) */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} 
          {selectedCategory !== "all" && ` em ${CATEGORIES.find(c => c.value === selectedCategory)?.label}`}
        </Text>
        {/* ❌ REMOVIDO: Indicador de tipo de usuário */}
      </View>

      {/* ✅ LISTA DE PRODUTOS FILTRADOS */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>
            {search || selectedCategory !== "all" 
              ? "Nenhum produto encontrado" 
              : "Nenhum produto cadastrado"
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {search || selectedCategory !== "all" 
              ? "Tente alterar os filtros ou buscar outros termos" 
              : isAdmin 
                ? 'Cadastre seu primeiro produto no botão "+" acima'
                : 'Aguarde o administrador cadastrar produtos'
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  headerButtons: {
    flexDirection: "row", 
    gap: 16
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#f4f0f0',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#886364',
  },
  categoriesContainer: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    backgroundColor: '#D9A59A',
    borderColor: '#D9A59A',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryIconSelected: {
    color: '#fff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#886364',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  counterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  counterText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // ❌ REMOVIDO: userRoleText
  productsList: { 
    paddingHorizontal: 8,
    paddingBottom: 80 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});