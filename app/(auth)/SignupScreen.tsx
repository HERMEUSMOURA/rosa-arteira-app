import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { registerUser } from "../../hooks/storage"; // ✅ ATUALIZE a importação

export default function SignupScreen() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ FUNÇÃO DE REGISTRO ATUALIZADA
  const handleSignup = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem!");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setIsLoading(true);

      // ✅ USAR A NOVA FUNÇÃO DE REGISTRO
      const result = await registerUser({
        name: nome,
        email: email,
        password: senha
      });

      if (result.success) {
        Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
        router.push("/(auth)/LoginScreen");
      } else {
        Alert.alert("Erro", result.message || "Erro ao criar conta");
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      Alert.alert("Erro", "Ocorreu um erro ao criar a conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#181111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar conta</Text>
      </View>

      <View style={styles.form}>
        {[
          { 
            placeholder: "Nome completo", 
            value: nome, 
            setter: setNome,
            autoCap: "words" as const
          },
          {
            placeholder: "E-mail",
            value: email,
            setter: setEmail,
            keyboard: "email-address" as const,
            autoCap: "none" as const,
          },
          { 
            placeholder: "Senha (mín. 6 caracteres)", 
            value: senha, 
            setter: setSenha, 
            secure: true 
          },
          {
            placeholder: "Confirmar senha",
            value: confirmarSenha,
            setter: setConfirmarSenha,
            secure: true,
          },
        ].map((field, idx) => (
          <TextInput
            key={idx}
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor="#886364"
            value={field.value}
            onChangeText={field.setter}
            keyboardType={field.keyboard}
            autoCapitalize={field.autoCap}
            secureTextEntry={field.secure}
          />
        ))}

        <TouchableOpacity 
          style={[
            styles.signupButton,
            isLoading && styles.signupButtonDisabled
          ]} 
          onPress={handleSignup}
          disabled={isLoading}
        >
          <Text style={styles.signupText}>
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/LoginScreen")}
          style={styles.loginLinkContainer}
        >
          <Text style={styles.loginLink}>Já tenho conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#181111",
    marginRight: 28,
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#f4f0f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    color: "#181111",
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: "#ea2a33",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  signupText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginLinkContainer: { 
    marginTop: 16 
  },
  loginLink: {
    textAlign: "center",
    color: "#886364",
    textDecorationLine: "underline",
    fontSize: 14,
  },
});