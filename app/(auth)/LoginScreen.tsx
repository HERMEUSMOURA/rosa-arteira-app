import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { loginUser, createDefaultAdmin } from "../../hooks/storage"; // ✅ ATUALIZE as importações

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ FUNÇÃO DE LOGIN ATUALIZADA
  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    try {
      setIsLoading(true);

      // ✅ USAR A NOVA FUNÇÃO DE LOGIN
      const result = await loginUser(email, senha);

      if (result.success && result.user) {
        Alert.alert("Sucesso", `Bem-vindo, ${result.user.name}!`);
        
        // ✅ REDIRECIONAMENTO BASEADO NO ROLE
        if (result.user.role === 'admin') {
          router.replace("/(tabs)/HomeScreen"); // Admin vai para mesma tela por enquanto
          // Depois podemos criar "(admin)/Dashboard" específico
        } else {
          router.replace("/(tabs)/HomeScreen");
        }
      } else {
        Alert.alert("Erro", result.message || "Email ou senha incorretos!");
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert("Erro", "Ocorreu um erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CRIAR ADMIN PADRÃO (executar uma vez)
  React.useEffect(() => {
    const initAdmin = async () => {
      await createDefaultAdmin();
    };
    initAdmin();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBh70QfaAD0ebDOhLFCdgaCvIerTe0i4KATIPi4OWyvXfe82phEjYI0xcA--Ush9ZCa8ucfxgudvu5qFgYgkP_iosIP0LIfU1JCUXx_pHFTKAgHYxQLlimQIQGAneqwx5q_X7kwv14CUdYrolsDFeVdyg07d_OnGVI7TMPpCFJAPMXzstKVLk8f6lMdMipSM3w2mgZHOvPfkSGE7VosKfvqVMqexXKfKmTiYZplYOkXq2BsgM6Vr_G7P-4OV5l0HFt7-VH3cjXqIAU",
          }}
          style={styles.logo}
        />
        <Text style={styles.title}>Rosa Arteira</Text>
      </View>

      <Text style={styles.subtitle}>Login</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Digite seu email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          placeholder="Digite sua senha"
          secureTextEntry
        />

        <TouchableOpacity style={styles.forgotButton}>
          <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.loginButton,
            isLoading && styles.loginButtonDisabled
          ]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginText}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Ou continue com</Text>
          <View style={styles.divider} />
        </View>

        {/* ✅ INFO DO ADMIN PADRÃO (apenas para desenvolvimento) */}
        {__DEV__ && (
          <View style={styles.devInfo}>
            <Text style={styles.devInfoText}>
              💡 Admin: admin@rosaarteira.com / admin123
            </Text>
          </View>
        )}

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/SignupScreen")}>
            <Text style={styles.signupLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  title: { fontSize: 40, color: "#E6A8A8" },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#333",
  },
  form: { width: "100%" },
  label: { fontSize: 14, color: "#666", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  forgotButton: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { color: "#E6A8A8", fontWeight: "500" },
  loginButton: {
    backgroundColor: "#C38383",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  loginButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  loginText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#ccc" },
  dividerText: { marginHorizontal: 8, color: "#888", fontSize: 14 },
  // ✅ NOVO: Info para desenvolvimento
  devInfo: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  devInfoText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
  },
  signupContainer: { flexDirection: "row", justifyContent: "center" },
  signupText: { color: "#666" },
  signupLink: { color: "#E6A8A8", fontWeight: "600" },
});