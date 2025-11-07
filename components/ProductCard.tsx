import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { addToCart, getStoredProductById, getCart } from "../hooks/storage"; // ✅ ADICIONE getCart

type Product = {
  id: string;
  name: string;
  price: number;
  images?: string[]; 
  image?: any;
  stock?: number;
};

type ProductCardProps = {
  product: Product;
  onPress?: () => void;
};

export default function ProductCard({ product, onPress }: ProductCardProps) {
  // ✅ FUNÇÃO ATUALIZADA com validação completa
  const handleAddToCart = async () => {
    try {
      // Para produtos SEM controle de estoque, permite adicionar livremente
      if (product.stock === undefined) {
        const success = await addToCart(product.id);
        if (success) {
          Alert.alert("Sucesso", `${product.name} adicionado ao carrinho!`);
        } else {
          Alert.alert("Erro", "Não foi possível adicionar ao carrinho.");
        }
        return;
      }

      // ✅ PARA PRODUTOS COM ESTOQUE: Verificação completa
      
      // 1. Busca dados ATUALIZADOS do produto
      const updatedProduct = await getStoredProductById(product.id);
      if (!updatedProduct || updatedProduct.stock === undefined) {
        Alert.alert("Erro", "Produto não encontrado.");
        return;
      }

      // 2. Verifica se já está esgotado
      if (updatedProduct.stock <= 0) {
        Alert.alert("Esgotado", "Este produto está esgotado.");
        return;
      }

      // 3. ✅ NOVO: Verifica quantas unidades JÁ ESTÃO no carrinho
      const currentCart = await getCart();
      const cartItem = currentCart.find(item => item.id === product.id);
      const quantityInCart = cartItem ? cartItem.quantity : 0;

      // 4. Verifica se pode adicionar MAIS 1 unidade
      if (quantityInCart >= updatedProduct.stock) {
        Alert.alert(
          "Estoque insuficiente", 
          `Você já tem ${quantityInCart} unidade(s) no carrinho.\nEstoque disponível: ${updatedProduct.stock}`
        );
        return;
      }

      // 5. Se passou todas as validações, ADICIONA ao carrinho
      const success = await addToCart(product.id);
      
      if (success) {
        Alert.alert("Sucesso", `${product.name} adicionado ao carrinho!`);
      } else {
        Alert.alert("Erro", "Não foi possível adicionar ao carrinho.");
      }

    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      Alert.alert("Erro", "Não foi possível adicionar ao carrinho.");
    }
  };

  // ✅ BOTÃO MAIS INTELIGENTE - mostra info do carrinho
  const getButtonText = async () => {
    try {
      // Para produtos sem estoque, texto normal
      if (product.stock === undefined) {
        return 'Adicionar ao Carrinho';
      }

      // Busca dados atualizados
      const updatedProduct = await getStoredProductById(product.id);
      if (!updatedProduct || updatedProduct.stock === undefined) {
        return 'Adicionar ao Carrinho';
      }

      // Verifica se está esgotado
      if (updatedProduct.stock <= 0) {
        return 'Esgotado';
      }

      // ✅ NOVO: Verifica quantas unidades já estão no carrinho
      const currentCart = await getCart();
      const cartItem = currentCart.find(item => item.id === product.id);
      const quantityInCart = cartItem ? cartItem.quantity : 0;

      if (quantityInCart > 0) {
        return `Adicionar (${quantityInCart}/${updatedProduct.stock} no carrinho)`;
      }

      return 'Adicionar ao Carrinho';
    } catch (error) {
      return 'Adicionar ao Carrinho';
    }
  };

  const [buttonText, setButtonText] = React.useState('Adicionar ao Carrinho');

  // ✅ ATUALIZA o texto do botão quando o componente monta
  React.useEffect(() => {
    const updateButtonText = async () => {
      const text = await getButtonText();
      setButtonText(text);
    };
    updateButtonText();
  }, [product.id]);

  // ... (função getProductImage permanece igual)
  const getProductImage = () => {
    if (product.images?.[0]) {
      return { uri: product.images[0] };
    }
    
    if (product.image) {
      if (typeof product.image === 'string') {
        return { uri: product.image };
      }
      return product.image;
    }
    
    return require("../assets/images/fundobase.jpg");
  };

  const hasStock = product.stock === undefined || product.stock > 0;
  const imageSource = getProductImage();

  return (
    <ThemedView style={styles.card}>
      <TouchableOpacity onPress={onPress} style={styles.touchable}>
        <Image 
          source={imageSource} 
          style={styles.image} 
          resizeMode="cover" 
        />
        
        {product.images && product.images.length > 1 && (
          <View style={styles.multipleImagesIndicator}>
            <Text style={styles.multipleImagesText}>+{product.images.length - 1}</Text>
          </View>
        )}
        
        <ThemedText style={styles.name} type="defaultSemiBold">
          {product.name}
        </ThemedText>
        
        <ThemedText style={styles.price}>
          R$ {product.price.toFixed(2)}
        </ThemedText>

        {product.stock !== undefined && (
          <Text style={[
            styles.stockText,
            !hasStock && styles.stockEmpty
          ]}>
            {hasStock ? `${product.stock} em estoque` : 'Esgotado'}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.addButton,
          !hasStock && styles.addButtonDisabled
        ]} 
        onPress={handleAddToCart}
        disabled={!hasStock}
      >
        <ThemedText style={styles.addButtonText}>
          {buttonText} {/* ✅ AGORA MOSTRA INFO DO CARRINHO */}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

// ... (styles permanecem iguais)
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    margin: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: "45%",
  },
  touchable: {
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f4f0f0",
  },
  multipleImagesIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  multipleImagesText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  name: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
    minHeight: 40,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D9A59A",
    marginBottom: 4,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 8,
  },
  stockAvailable: {
    color: "#34C759",
  },
  stockEmpty: {
    color: "#FF3B30",
  },
  addButton: {
    backgroundColor: "#D9A59A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: 'center',
  },
});