import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Text, // ✅ ADICIONE Text
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import {
  getCart,
  finalizePurchase,
  removeOneFromCart,
  getProducts,
  clearCart,
} from "../../hooks/storage";
import { initialProducts } from "../../constants/products";
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";

type CartEntry = { id: string; quantity: number };
type Product = { id: string; name: string; price: number; stock?: number };

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [cartEntries, setCartEntries] = useState<CartEntry[]>([]);
  const [detailed, setDetailed] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // ✅ CORRIGIDO: Agora recarrega sempre que a tela ganha foco
  useEffect(() => {
    if (isFocused) {
      reload();
    }
  }, [isFocused]);

  const buildDetailed = async (entries: CartEntry[]) => {
    const storedProducts = await getProducts();
    const allProducts = [...initialProducts, ...storedProducts];
    const detailedList: Product[] = [];
    for (const e of entries) {
      const found = allProducts.find((p) => p.id === e.id);
      if (found) {
        detailedList.push({ 
          id: found.id, 
          name: found.name, 
          price: found.price, 
          stock: found.stock 
        });
      } else {
        detailedList.push({ 
          id: e.id, 
          name: `Produto ${e.id}`, 
          price: 0 
        });
      }
    }
    setDetailed(detailedList);
  };

  const reload = async () => {
    try {
      const c = await getCart();
      console.log('🛒 Carrinho carregado:', c);
      setCartEntries(c);
      await buildDetailed(c);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
  };

  const removeOne = async (id: string) => {
    try {
      await removeOneFromCart(id);
      await reload();
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível remover o item");
    }
  };

  // ✅ ADICIONE: Função para limpar carrinho (debug)
  const clearCartDebug = async () => {
    try {
      await clearCart();
      await reload();
      Alert.alert("Carrinho limpo", "Todos os itens foram removidos");
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
    }
  };

  const finalize = async () => {
    if (cartEntries.length === 0) {
      return Alert.alert("Carrinho vazio", "Adicione produtos antes de finalizar a compra.");
    }
    if (!paymentMethod) {
      return Alert.alert("Selecione o método de pagamento", "Escolha uma forma de pagamento para continuar.");
    }

    try {
      const result = await finalizePurchase(paymentMethod);
      
      if (result.ok) {
        setCartEntries([]);
        setDetailed([]);
        setPaymentMethod("");
        Alert.alert("Pedido realizado", "Sua compra foi finalizada com sucesso!");
      } else {
        Alert.alert("Erro no estoque", result.reason);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível finalizar a compra.");
    }
  };

  const renderItem = ({ item }: { item: CartEntry }) => {
    const product = detailed.find((p) => p.id === item.id);
    const name = product ? product.name : item.id;
    const price = product ? product.price : 0;
    const total = price * item.quantity;

    return (
      <ThemedView style={styles.itemContainer}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.itemName}>{name}</ThemedText>
          <ThemedText style={styles.itemPrice}>
            Qtd: {item.quantity} - R$ {total.toFixed(2)}
          </ThemedText>
          {product?.stock !== undefined && (
            <ThemedText style={styles.stockText}>
              Estoque: {product.stock}
            </ThemedText>
          )}
        </View>
        <TouchableOpacity onPress={() => removeOne(item.id)}>
          <ThemedText style={styles.removeButton}>Remover</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Carrinho</ThemedText>

      {/* ✅ ADICIONE: Botão de debug (remova depois) */}
      {__DEV__ && cartEntries.length > 0 && (
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={clearCartDebug}
        >
          <ThemedText style={styles.debugButtonText}>
            🗑️ Limpar Carrinho (Debug)
          </ThemedText>
        </TouchableOpacity>
      )}

      {cartEntries.length > 0 ? (
        <>
          <FlatList
            data={cartEntries}
            keyExtractor={(it, idx) => `${it.id}-${idx}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />

          <View style={styles.totalContainer}>
            <ThemedText style={styles.totalText}>Total:</ThemedText>
            <ThemedText style={styles.totalValue}>
              R$ {cartEntries.reduce((sum, entry) => {
                const product = detailed.find(p => p.id === entry.id);
                return sum + (product ? product.price * entry.quantity : 0);
              }, 0).toFixed(2)}
            </ThemedText>
          </View>

          <View style={styles.paymentContainer}>
            <ThemedText style={styles.paymentLabel}>Método de Pagamento:</ThemedText>
            <View style={styles.pickerWrapper}>
              <Picker 
                selectedValue={paymentMethod} 
                onValueChange={(v) => setPaymentMethod(v)} 
                style={styles.picker}
              >
                <Picker.Item label="Selecione" value="" />
                <Picker.Item label="Cartão de Crédito" value="cartao_credito" />
                <Picker.Item label="Pix" value="pix" />
                <Picker.Item label="Dinheiro" value="dinheiro" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.finalizeButton} onPress={finalize}>
            <ThemedText style={styles.finalizeText}>Finalizar Compra</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <ThemedText style={styles.emptyText}>Seu carrinho está vazio.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 , paddingTop: 40,  paddingBottom: 60,},
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#181111" },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f4f0f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemName: { fontSize: 16, fontWeight: "500", color: "#181111" },
  itemPrice: { fontSize: 14, color: "#886364" },
  stockText: { fontSize: 12, color: "#666", marginTop: 2 },
  removeButton: { color: "#ea2a33", fontWeight: "bold" },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 20,
  },
  totalText: { fontSize: 18, fontWeight: "bold", color: "#181111" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#181111" },
  paymentContainer: { marginBottom: 16 },
  paymentLabel: { fontSize: 16, fontWeight: "500", marginBottom: 6 },
  pickerWrapper: {
    backgroundColor: "#f4f0f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: { height: 44 },
  finalizeButton: {
    backgroundColor: "#181111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  finalizeText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#886364", marginTop: 50 },
  debugButton: {
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  debugButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});