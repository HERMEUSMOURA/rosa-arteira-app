import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Text,
  Modal,
  ScrollView,
  TextInput, // ✅ ADICIONE: TextInput
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import {
  getCart,
  finalizePurchase,
  removeOneFromCart,
  getProducts,
  clearCart,
  getDefaultAddress,
  Address, // ✅ ADICIONE: Tipo Address
} from "../../hooks/storage";
import { initialProducts } from "../../constants/products";
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";

type CartEntry = { id: string; quantity: number };
type Product = { id: string; name: string; price: number; stock?: number };

// ✅ ADICIONE: Componente de formulário de endereço (inline)
function AddressForm({ 
  onAddressSelect, 
  onCancel,
  initialAddress 
}: { 
  onAddressSelect: (address: Address) => void;
  onCancel?: () => void;
  initialAddress?: Address;
}) {
  const [address, setAddress] = useState<Omit<Address, 'id'>>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  React.useEffect(() => {
    if (initialAddress) {
      const { id, ...addressData } = initialAddress;
      setAddress(addressData);
    }
  }, [initialAddress]);

  const handleSubmit = () => {
    // Validação básica
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.zipCode) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    // Criar objeto Address completo para passar para o pedido
    const completeAddress: Address = {
      ...address,
      id: Date.now().toString(), // ID temporário
    };
    onAddressSelect(completeAddress);
  };

  return (
    <ScrollView style={styles.modalContainer}>
      <ThemedText style={styles.modalTitle}>Endereço de Entrega</ThemedText>
      
      <TextInput
        style={styles.input}
        placeholder="Rua *"
        value={address.street}
        onChangeText={(text) => setAddress({ ...address, street: text })}
      />
      
      <View style={styles.rowInput}>
        <TextInput
          style={[styles.input, styles.flex1, styles.mr2]}
          placeholder="Número *"
          value={address.number}
          onChangeText={(text) => setAddress({ ...address, number: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.flex1]}
          placeholder="Complemento"
          value={address.complement}
          onChangeText={(text) => setAddress({ ...address, complement: text })}
        />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Bairro *"
        value={address.neighborhood}
        onChangeText={(text) => setAddress({ ...address, neighborhood: text })}
      />
      
      <View style={styles.rowInput}>
        <TextInput
          style={[styles.input, styles.flex2, styles.mr2]}
          placeholder="Cidade *"
          value={address.city}
          onChangeText={(text) => setAddress({ ...address, city: text })}
        />
        <TextInput
          style={[styles.input, styles.flex1]}
          placeholder="UF *"
          value={address.state}
          onChangeText={(text) => setAddress({ ...address, state: text.toUpperCase() })}
          maxLength={2}
        />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="CEP *"
        value={address.zipCode}
        onChangeText={(text) => setAddress({ ...address, zipCode: text })}
        keyboardType="numeric"
      />
      
      <View style={styles.defaultAddressContainer}>
        <TouchableOpacity
          onPress={() => setAddress({ ...address, isDefault: !address.isDefault })}
          style={styles.checkboxContainer}
        >
          <View style={[styles.checkbox, address.isDefault && styles.checkboxChecked]} />
          <ThemedText style={styles.checkboxLabel}>Definir como endereço padrão</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.modalButtons}>
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.modalButton, styles.cancelButton]}
          >
            <ThemedText style={styles.modalButtonText}>Cancelar</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.modalButton, styles.saveButton]}
        >
          <ThemedText style={styles.modalButtonText}>
            {initialAddress ? 'Atualizar' : 'Salvar Endereço'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [cartEntries, setCartEntries] = useState<CartEntry[]>([]);
  const [detailed, setDetailed] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null); // ✅ ADICIONE: Estado para endereço
  const [showAddressForm, setShowAddressForm] = useState(false); // ✅ ADICIONE: Modal de endereço

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
      
      // ✅ ADICIONE: Carregar endereço padrão
      const defaultAddress = await getDefaultAddress();
      setSelectedAddress(defaultAddress);
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

  // ✅ ADICIONE: Função para selecionar endereço
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
  };

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
    // ✅ ADICIONE: Validação de endereço
    if (!selectedAddress) {
      return Alert.alert("Endereço necessário", "Por favor, selecione um endereço de entrega");
    }

    try {
      const result = await finalizePurchase(paymentMethod, selectedAddress); // ✅ ATUALIZE: Passe o endereço
      
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

          {/* ✅ ADICIONE: Seção de Endereço de Entrega */}
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <ThemedText style={styles.addressTitle}>Endereço de Entrega</ThemedText>
              <TouchableOpacity onPress={() => setShowAddressForm(true)}>
                <ThemedText style={styles.changeAddressText}>
                  {selectedAddress ? 'Alterar' : 'Adicionar'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {selectedAddress ? (
              <View style={styles.addressCard}>
                <ThemedText style={styles.addressStreet}>
                  {selectedAddress.street}, {selectedAddress.number}
                  {selectedAddress.complement && ` - ${selectedAddress.complement}`}
                </ThemedText>
                <ThemedText style={styles.addressNeighborhood}>
                  {selectedAddress.neighborhood}
                </ThemedText>
                <ThemedText style={styles.addressCity}>
                  {selectedAddress.city} - {selectedAddress.state}
                </ThemedText>
                <ThemedText style={styles.addressZip}>
                  CEP: {selectedAddress.zipCode}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.noAddressText}>
                Nenhum endereço selecionado
              </ThemedText>
            )}
          </View>

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

          <TouchableOpacity 
            style={[
              styles.finalizeButton, 
              (!selectedAddress || !paymentMethod) && styles.finalizeButtonDisabled
            ]} 
            onPress={finalize}
            disabled={!selectedAddress || !paymentMethod}
          >
            <ThemedText style={styles.finalizeText}>
              Finalizar Compra
            </ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <ThemedText style={styles.emptyText}>Seu carrinho está vazio.</ThemedText>
      )}

      {/* ✅ ADICIONE: Modal de Endereço */}
      <Modal
        visible={showAddressForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressForm(false)}
      >
        <AddressForm
          onAddressSelect={handleAddressSelect}
          onCancel={() => setShowAddressForm(false)}
          initialAddress={selectedAddress || undefined}
        />
      </Modal>
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
  
  // ✅ ADICIONE: Estilos para a seção de endereço
  addressSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181111",
  },
  changeAddressText: {
    color: "#007AFF",
    fontWeight: "500",
  },
  addressCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: "500",
    color: "#181111",
    marginBottom: 4,
  },
  addressNeighborhood: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  addressCity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  addressZip: {
    fontSize: 14,
    color: "#666",
  },
  noAddressText: {
    color: "#886364",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
  },
  
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
  finalizeButtonDisabled: {
    backgroundColor: "#cccccc",
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
  
  // ✅ ADICIONE: Estilos para o modal de endereço
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  rowInput: {
    flexDirection: "row",
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  mr2: {
    marginRight: 8,
  },
  defaultAddressContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});