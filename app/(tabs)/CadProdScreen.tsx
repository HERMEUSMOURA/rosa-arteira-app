import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation, useRouter } from "expo-router"; // ✅ ADICIONE useRouter
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from 'expo-image-picker';
import { saveProduct } from "../../hooks/storage";
import { useAuth } from "../../hooks/useAuth"; // ✅ ADICIONE

// ✅ CATEGORIAS DISPONÍVEIS
const CATEGORIES = [
  { label: "Selecione uma categoria", value: "" },
  { label: "👕 Camisa", value: "camisa" },
  { label: "👚 Blusa", value: "blusa" },
  { label: "🛠️ Artesanato", value: "artesanato" },
  { label: "👖 Calça", value: "calca" },
  { label: "📦 Outros", value: "outros" },
];

export default function CadProdScreen() {
  const navigation = useNavigation<any>();
  const router = useRouter(); // ✅ ADICIONE
  const { isAdmin, loading: authLoading } = useAuth(); // ✅ ADICIONE
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [stock, setStock] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ PROTEGER ACESSO DIRETO - VERIFICA SE É ADMIN
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      Alert.alert(
        "Acesso Negado", 
        "Apenas administradores podem acessar esta página.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/ProdScreen") }]
      );
    }
  }, [isAdmin, authLoading]);

  // ✅ MOSTRAR LOADING OU ACESSO NEGADO
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedTitle}>Acesso Negado</Text>
        <Text style={styles.accessDeniedText}>
          Apenas administradores podem cadastrar produtos.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/ProdScreen")}
        >
          <Text style={styles.backButtonText}>Voltar para Produtos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Função para selecionar imagens
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão necessária", "Precisamos acessar sua galeria para selecionar imagens.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagens:', error);
      Alert.alert("Erro", "Não foi possível selecionar as imagens.");
    }
  };

  // Remover imagem específica
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name || !price) {
      return Alert.alert("Erro", "Nome e preço são obrigatórios.");
    }

    if (!category) {
      return Alert.alert("Erro", "Selecione uma categoria para o produto.");
    }

    if (images.length === 0) {
      return Alert.alert("Erro", "Selecione pelo menos uma imagem do produto.");
    }

    try {
      setIsLoading(true);

      const prod = {
        name,
        price: Number(price),
        description: description.trim(),
        category,
        images,
        stock: stock ? Number(stock) : 0,
      };

      await saveProduct(prod);
      Alert.alert("Sucesso", "Produto cadastrado com sucesso!");

      // Limpa campos
      setName("");
      setPrice("");
      setDescription("");
      setCategory("");
      setImages([]);
      setStock("");
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert("Erro", "Não foi possível salvar o produto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cadastrar Produto</Text>

        <Text style={styles.label}>Nome do Produto *</Text>
        <TextInput 
          value={name} 
          onChangeText={setName} 
          style={styles.input} 
          placeholder="Nome do produto" 
        />

        <Text style={styles.label}>Preço *</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          style={styles.input}
          placeholder="Preço (ex: 120.50)"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          placeholder="Descreva o produto (cor, material, tamanho, etc.)"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={styles.picker}
          >
            {CATEGORIES.map((cat) => (
              <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Imagens do Produto *</Text>
        
        <TouchableOpacity 
          style={styles.imagePickerButton} 
          onPress={pickImages}
          disabled={isLoading}
        >
          <Text style={styles.imagePickerText}>
            {isLoading ? "Carregando..." : "📸 Selecionar Fotos da Galeria"}
          </Text>
        </TouchableOpacity>

        {/* Preview das imagens selecionadas */}
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesLabel}>
              {images.length} imagem(ns) selecionada(s):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((imageUri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Quantidade em estoque</Text>
        <TextInput
          value={stock}
          onChangeText={setStock}
          style={styles.input}
          placeholder="Ex: 10"
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={[
            styles.button, 
            (isLoading || images.length === 0 || !category) && styles.buttonDisabled
          ]} 
          onPress={handleSave}
          disabled={isLoading || images.length === 0 || !category}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Salvando..." : "Salvar produto"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, paddingBottom:60},
  // ✅ ESTILOS PARA ACESSO NEGADO
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#D9A59A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // ESTILOS EXISTENTES
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20, 
    color: "#D9A59A",
    textAlign: "center"
  },
  label: { 
    marginTop: 8, 
    marginBottom: 6, 
    color: "#333",
    fontWeight: "600"
  },
  input: {
    backgroundColor: "#f4f0f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: "#f4f0f0",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  imagePickerButton: {
    backgroundColor: "#D9A59A",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePickerText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imagesLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#D9A59A",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16,
  },
});