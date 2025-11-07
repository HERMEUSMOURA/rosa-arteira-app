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
import { getUsers, promoteToAdmin, User, updateUsers } from "../../hooks/storage";

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  });

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      usersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      Alert.alert("Erro", "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handlePromoteToAdmin = (userId: string, userName: string) => {
    Alert.alert(
      "Promover para Admin",
      `Tem certeza que deseja promover "${userName}" para administrador?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Promover",
          style: "default",
          onPress: async () => {
            try {
              const success = await promoteToAdmin(userId);
              if (success) {
                await loadUsers();
                Alert.alert("Sucesso", "Usuário promovido para administrador!");
              } else {
                Alert.alert("Erro", "Não foi possível promover o usuário.");
              }
            } catch (error) {
              console.error('Erro ao promover usuário:', error);
              Alert.alert("Erro", "Erro ao promover usuário.");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "user",
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    if (!editForm.name.trim() || !editForm.email.trim()) {
      Alert.alert("Erro", "Nome e email são obrigatórios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      Alert.alert("Erro", "Por favor, insira um email válido.");
      return;
    }

    try {
      const updatedUsers = users.map(user =>
        user.id === editingUser.id
          ? {
              ...user,
              name: editForm.name.trim(),
              email: editForm.email.trim(),
              role: editForm.role,
              ...(editForm.password.trim() && { password: editForm.password.trim() }),
            }
          : user
      );

      const success = await updateUsers(updatedUsers);
      if (success) {
        await loadUsers();
        setEditModalVisible(false);
        setEditingUser(null);
        Alert.alert("Sucesso", "Usuário atualizado com sucesso!");
      } else {
        Alert.alert("Erro", "Não foi possível atualizar o usuário.");
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      Alert.alert("Erro", "Erro ao atualizar usuário.");
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    const currentUser = users.find(u => u.id === userId);
    if (currentUser?.email === "admin@rosaarteira.com") {
      Alert.alert("Ação não permitida", "Não é possível excluir o usuário admin principal.");
      return;
    }

    Alert.alert(
      "Excluir Usuário",
      `Tem certeza que deseja excluir "${userName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedUsers = users.filter(user => user.id !== userId);
              const success = await updateUsers(updatedUsers);
              if (success) {
                await loadUsers();
                Alert.alert("Sucesso", "Usuário excluído com sucesso!");
              } else {
                Alert.alert("Erro", "Não foi possível excluir o usuário.");
              }
            } catch (error) {
              console.error('Erro ao excluir usuário:', error);
              Alert.alert("Erro", "Erro ao excluir usuário.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      return "Data inválida";
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter(user => user.role === 'admin').length,
    regular: users.filter(user => user.role === 'user').length,
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getSafeName = (name: string | undefined) => {
    return name || 'Usuário sem nome';
  };

  const getSafeEmail = (email: string | undefined) => {
    return email || 'Sem email';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={styles.loadingText}>Carregando usuários...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gerenciar Usuários</Text>
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
        <Ionicons name="search-outline" size={20} color="#886364" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuários..."
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

      {/* CARDS DE ESTATÍSTICAS */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.admins}</Text>
          <Text style={styles.statLabel}>Administradores</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.regular}</Text>
          <Text style={styles.statLabel}>Usuários</Text>
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
            {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'} 
            {searchQuery && ' encontrados'}
          </Text>
        </View>

        {/* LISTA DE USUÁRIOS */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#C4A89B" />
            <Text style={styles.emptyText}>
              {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? "Tente buscar com outros termos" 
                : "Os usuários aparecerão aqui quando se cadastrarem"}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user, index) => (
            <View key={user.id || `user-${index}`} style={styles.userCard}>
              {/* AVATAR E INFO PRINCIPAL */}
              <View style={styles.userMain}>
                <View style={[
                  styles.avatar,
                  { backgroundColor: user.role === 'admin' ? '#D9A59A' : '#8BA6D9' }
                ]}>
                  <Text style={styles.avatarText}>
                    {getInitials(user.name)}
                  </Text>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {getSafeName(user.name)}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {getSafeEmail(user.email)}
                  </Text>
                  <Text style={styles.userDate}>
                    Cadastrado em: {formatDate(user.createdAt)}
                  </Text>
                </View>
              </View>

              {/* STATUS E AÇÕES */}
              <View style={styles.userActions}>
                <View style={[
                  styles.roleBadge,
                  { backgroundColor: user.role === 'admin' ? '#D9A59A' : '#7BBF93' }
                ]}>
                  <Text style={styles.roleText}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  {/* BOTÃO EDITAR */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(user)}
                  >
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>

                  {/* BOTÃO PROMOVER (apenas para usuários regulares) */}
                  {user.role === 'user' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.promoteButton]}
                      onPress={() => handlePromoteToAdmin(user.id, getSafeName(user.name))}
                    >
                      <Ionicons name="shield-outline" size={14} color="#fff" />
                      <Text style={styles.actionButtonText}>Promover</Text>
                    </TouchableOpacity>
                  )}

                  {/* BOTÃO EXCLUIR (não disponível para admin principal) */}
                  {user.email !== "admin@rosaarteira.com" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteUser(user.id, getSafeName(user.name))}
                    >
                      <Ionicons name="trash-outline" size={14} color="#fff" />
                      <Text style={styles.actionButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL DE EDIÇÃO */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Usuário</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#886364" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="Nome completo"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                  placeholder="email@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.password}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
                  placeholder="Deixe em branco para manter a senha atual"
                  secureTextEntry
                />
                <Text style={styles.helperText}>Preencha apenas se quiser alterar a senha</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Usuário</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      editForm.role === 'user' && styles.roleOptionActive
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, role: 'user' }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      editForm.role === 'user' && styles.roleOptionTextActive
                    ]}>
                      Usuário
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      editForm.role === 'admin' && styles.roleOptionActive
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, role: 'admin' }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      editForm.role === 'admin' && styles.roleOptionTextActive
                    ]}>
                      Administrador
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </TouchableOpacity>
            </View>
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#181111',
    paddingVertical: 4,
    marginLeft: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
  userCard: {
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
  userMain: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181111',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#886364',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#C4A89B',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
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
  editButton: {
    backgroundColor: '#8BA6D9',
  },
  promoteButton: {
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
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181111',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8D0C4',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#181111',
    backgroundColor: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#886364',
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E8D0C4',
    alignItems: 'center',
  },
  roleOptionActive: {
    borderColor: '#D9A59A',
    backgroundColor: '#f4f0f0',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#886364',
    fontWeight: '600',
  },
  roleOptionTextActive: {
    color: '#D9A59A',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f4f0f0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f4f0f0',
  },
  saveButton: {
    backgroundColor: '#D9A59A',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#886364',
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});