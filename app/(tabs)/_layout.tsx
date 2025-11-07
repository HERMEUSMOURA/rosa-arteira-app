import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { ActivityIndicator, View, Platform } from "react-native";
import { useSafeArea } from "../../hooks/useSafeArea";

export default function TabsLayout() {
  const { isAdmin, loading } = useAuth();
  const { bottomSafeArea } = useSafeArea();

  // 🔄 Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#D9A59A" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarActiveTintColor: "#D9A59A", 
        tabBarInactiveTintColor: "#C4A89B", 
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f4f0f0",
          height: 70, // ✅ Aumentei de 60 para 70
          paddingBottom: 80, // ✅ Aumentei o padding
          paddingTop: 8,
},
        tabBarLabelStyle: { 
          fontSize: 12, 
          marginBottom: 4,
        },
      }}
    >
      {/* ✅ TABS VISÍVEIS PARA TODOS OS USUÁRIOS */}
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="CartScreen"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProdScreen"
        options={{
          title: "Produtos",
          tabBarIcon: ({ color, size }) => <Ionicons name="file-tray-full-outline" size={size} color={color} />,
        }}
      />
      
      {/* ✅ TABS ADMINISTRATIVAS */}
      <Tabs.Screen
        name="CadProdScreen"
        options={{
          href: isAdmin ? undefined : null,
          title: "Cadastrar",
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="AdminDashboard"
        options={{
          href: isAdmin ? undefined : null,
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="OrdersScreen"
        options={{
          href: isAdmin ? undefined : null,
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="ManageProducts"
        options={{
          href: isAdmin ? undefined : null,
          title: "Gerenciar",
          tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="ManageUsers"
        options={{
          href: isAdmin ? undefined : null,
          title: "Usuários",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />

      {/* ❌ OCULTAR COMPLETAMENTE SE NÃO FOR ADMIN */}
      {!isAdmin && (
        <>
          <Tabs.Screen name="CadProdScreen" options={{ href: null }} />
          <Tabs.Screen name="AdminDashboard" options={{ href: null }} />
          <Tabs.Screen name="OrdersScreen" options={{ href: null }} />
          <Tabs.Screen name="ManageProducts" options={{ href: null }} />
          <Tabs.Screen name="ManageUsers" options={{ href: null }} />
        </>
      )}
    </Tabs>
  );
}