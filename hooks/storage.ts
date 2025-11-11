import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Centralizado: chaves usadas no AsyncStorage
 */
const USERS_KEY = "@usuarios_app";
const PRODUCTS_KEY = "@products";
const CART_KEY = "@cart";
const ORDERS_KEY = "@orders";
const ADDRESSES_KEY = "@user_addresses";

/**
 * Tipagens
 */
export type User = {
  id: string;
  name: string;
  email: string;
  password: string; 
  role: 'admin' | 'user'; 
  createdAt: string;
  [k: string]: any;
};

export type ProductHistory = {
  type: 'created' | 'sold' | 'updated' | 'stock_updated';
  date: string;
  by: string; 
  details?: {
    orderId?: string;
    quantity?: number;
    price?: number;
    customerName?: string;
    previousStock?: number;
    newStock?: number;
    changes?: Record<string, any>; 
  };
};

export type StoredProduct = {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  images?: string[];
  stock?: number;
  createdBy: string;
  createdAt: string;
  history: ProductHistory[]; 
  totalSold: number; 
  lastSoldAt?: string; 
};

export type CartEntry = {
  id: string; 
  quantity: number;
};

export type Order = {
  id: string;
  date: string;
  total: number;
  paymentMethod: string;
  items: CartEntry[];
  userId: string; // 
  status: 'pending' | 'preparing' | 'shipped' | 'delivered'; 
  customerName?: string; 
  customerEmail?: string; 
  shippingAddress: Address;
  estimatedDelivery?: string;
  trackingCode?: string;
};
export type Address = {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
};

/**
 * Helper: safe JSON parse
 */
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error("safeParse error:", e);
    return fallback;
  }
}

/* ------------------------
   USERS
   ------------------------ */

export async function getUsers(): Promise<User[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return safeParse<User[]>(raw, []);
  } catch (e) {
    console.error("getUsers error", e);
    return [];
  }
}

export async function clearUsers(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(USERS_KEY);
    return true;
  } catch (e) {
    console.error("clearUsers error", e);
    return false;
  }
}

/* ------------------------
   AUTH & USERS
   ------------------------ */

// Registrar novo usuário (padrão como 'user')
export async function registerUser(userData: { name: string; email: string; password: string }): Promise<{ success: boolean; message: string }> {
  try {
    const users = await getUsers();
    
    // Verificar se email já existe
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: "Email já cadastrado" };
    }

    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: 'user',
      createdAt: new Date().toISOString(),
};
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { success: true, message: "Usuário criado com sucesso" };
  } catch (e) {
    console.error("registerUser error", e);
    return { success: false, message: "Erro ao criar usuário" };
  }
}

// Login de usuário
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
  try {
    const users = await getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Salvar usuário logado (session)
      await AsyncStorage.setItem('@current_user', JSON.stringify(user));
      return { success: true, user, message: "Login realizado" };
    } else {
      return { success: false, message: "Email ou senha incorretos" };
    }
  } catch (e) {
    console.error("loginUser error", e);
    return { success: false, message: "Erro ao fazer login" };
  }
}

// Obter usuário atual
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userJson = await AsyncStorage.getItem('@current_user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    console.error("getCurrentUser error", e);
    return null;
  }
}

// Logout
export async function logoutUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem('@current_user');
  } catch (e) {
    console.error("logoutUser error", e);
  }
}


export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}


export async function createDefaultAdmin(): Promise<void> {
  try {
    const users = await getUsers();
    const adminExists = users.find(u => u.email === 'admin@rosaarteira.com');
    
    if (!adminExists) {
      const adminUser: User = {
        id: 'admin-001',
        name: 'Administrador',
        email: 'admin@rosaarteira.com',
        password: 'admin123', // Mudar na primeira vez!
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      users.push(adminUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      console.log('Admin padrão criado');
    }
  } catch (e) {
    console.error("createDefaultAdmin error", e);
  }
}


export async function updateUsers(users: User[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Erro ao atualizar usuários:', error);
    return false;
  }
}

/* ------------------------
   PRODUCTS
   ------------------------ */

export async function getProducts(): Promise<StoredProduct[]> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCTS_KEY);
    return safeParse<StoredProduct[]>(raw, []);
  } catch (e) {
    console.error("getProducts error", e);
    return [];
  }
}


export async function saveProduct(product: Omit<StoredProduct, 'id' | 'createdBy' | 'createdAt' | 'history' | 'totalSold'>): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    const products = await getProducts();
    const newProduct: StoredProduct = {
      ...product,
      id: Date.now().toString(),
      createdBy: currentUser.id, 
      createdAt: new Date().toISOString(),
      history: [{
        type: 'created',
        date: new Date().toISOString(),
        by: currentUser.id,
        details: {
          price: product.price,
          stock: product.stock
        }
      }],
      totalSold: 0
    };

    products.push(newProduct);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return true;
  } catch (e) {
    console.error("saveProduct error", e);
    return false;
  }
}


/** Replace entire stored products array */
export async function updateProducts(products: StoredProduct[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return true;
  } catch (e) {
    console.error("updateProducts error", e);
    return false;
  }
}

/** Helper: find product by id (in stored products) */
export async function getStoredProductById(id: string): Promise<StoredProduct | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}
export async function addProductHistory(
  productId: string, 
  history: Omit<ProductHistory, 'date'>
): Promise<boolean> {
  try {
    const products = await getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) return false;
    
    const newHistory: ProductHistory = {
      ...history,
      date: new Date().toISOString()
    };
    
    // Inicializa arrays se não existirem
    if (!products[productIndex].history) {
      products[productIndex].history = [];
    }
    
    products[productIndex].history.unshift(newHistory); // Mais recente primeiro
    
    // Atualiza total vendido e última venda se for uma venda
    if (history.type === 'sold' && history.details?.quantity) {
      products[productIndex].totalSold = 
        (products[productIndex].totalSold || 0) + history.details.quantity;
      products[productIndex].lastSoldAt = new Date().toISOString();
    }
    
    await updateProducts(products);
    return true;
  } catch (error) {
    console.error('Erro ao adicionar histórico:', error);
    return false;
  }
}

/* ------------------------
   CART
   ------------------------ */

export async function getCart(): Promise<CartEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return safeParse<CartEntry[]>(raw, []);
  } catch (e) {
    console.error("getCart error", e);
    return [];
  }
}

export async function setCart(cart: CartEntry[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
    return true;
  } catch (e) {
    console.error("setCart error", e);
    return false;
  }
}

/** Add 1 unit (or create entry) for productId */
export async function addToCart(productId: string): Promise<boolean> {
  try {
    const cart = await getCart();
    const idx = cart.findIndex((c) => c.id === productId);
    if (idx >= 0) {
      cart[idx].quantity += 1; // ✅ Apenas +1 unidade
    } else {
      cart.push({ id: productId, quantity: 1 }); // ✅ Apenas 1 unidade
    }
    await setCart(cart);
    return true;
  } catch (e) {
    console.error("addToCart error", e);
    return false;
  }
}

// ✅ CORRIGIDO: Movida para a seção CART
export async function canAddToCart(productId: string, quantity: number = 1): Promise<boolean> {
  try {
    const product = await getStoredProductById(productId);
    if (product && product.stock !== undefined) {
      return product.stock >= quantity;
    }
    return true; // Produtos sem controle de estoque sempre podem ser adicionados
  } catch (error) {
    console.error('Erro ao verificar estoque:', error);
    return false;
  }
}

/** Remove one unit of productId (or remove entry if quantity becomes 0) */
export async function removeOneFromCart(productId: string): Promise<boolean> {
  try {
    const cart = await getCart();
    const idx = cart.findIndex((c) => c.id === productId);
    if (idx >= 0) {
      if (cart[idx].quantity > 1) cart[idx].quantity -= 1;
      else cart.splice(idx, 1);
      await setCart(cart);
    }
    return true;
  } catch (e) {
    console.error("removeOneFromCart error", e);
    return false;
  }
}

export async function clearCart(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(CART_KEY);
    return true;
  } catch (e) {
    console.error("clearCart error", e);
    return false;
  }
}

/* ------------------------
   ORDERS
   ------------------------ */

export async function getOrders(): Promise<Order[]> {
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    return safeParse<Order[]>(raw, []);
  } catch (e) {
    console.error("getOrders error", e);
    return [];
  }
}

export async function saveOrder(order: Order): Promise<boolean> {
  try {
    const arr = await getOrders();
    arr.push(order);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    console.error("saveOrder error", e);
    return false;
  }
}

/* ------------------------
   ADDRESS MANAGEMENT
   ------------------------ */

// Obter endereços do usuário atual
export async function getUserAddresses(): Promise<Address[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    
    const raw = await AsyncStorage.getItem(`${ADDRESSES_KEY}_${currentUser.id}`);
    return safeParse<Address[]>(raw, []);
  } catch (e) {
    console.error("getUserAddresses error", e);
    return [];
  }
}

// Salvar endereço do usuário
export async function saveUserAddress(address: Omit<Address, 'id'>): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    
    const addresses = await getUserAddresses();
    const newAddress: Address = {
      ...address,
      id: Date.now().toString(),
    };
    
    // Se for o primeiro endereço ou marcado como padrão, definir como padrão
    if (addresses.length === 0 || address.isDefault) {
      newAddress.isDefault = true;
      // Remover padrão de outros endereços
      addresses.forEach(addr => { addr.isDefault = false; });
    }
    
    addresses.push(newAddress);
    await AsyncStorage.setItem(`${ADDRESSES_KEY}_${currentUser.id}`, JSON.stringify(addresses));
    return true;
  } catch (e) {
    console.error("saveUserAddress error", e);
    return false;
  }
}

// Obter endereço padrão do usuário
export async function getDefaultAddress(): Promise<Address | null> {
  try {
    const addresses = await getUserAddresses();
    return addresses.find(addr => addr.isDefault) || addresses[0] || null;
  } catch (e) {
    console.error("getDefaultAddress error", e);
    return null;
  }
}

// Definir endereço como padrão
export async function setDefaultAddress(addressId: string): Promise<boolean> {
  try {
    const addresses = await getUserAddresses();
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    
    await AsyncStorage.setItem(`${ADDRESSES_KEY}_${currentUser.id}`, JSON.stringify(updatedAddresses));
    return true;
  } catch (e) {
    console.error("setDefaultAddress error", e);
    return false;
  }
}

/* ------------------------
   STOCK / FINALIZE PURCHASE
   ------------------------ */

/**
 * Decrease stored product stocks according to counts map: { [productId]: amountToDecrease }
 * Returns updated products array (or false on error)
 */
export async function decreaseStockBulk(counts: Record<string, number>): Promise<StoredProduct[] | false> {
  try {
    const products = await getProducts();
    const updated = products.map((p) => {
      if (p.stock !== undefined && counts[p.id]) {
        return { ...p, stock: Math.max(0, p.stock - counts[p.id]) };
      }
      return p;
    });
    await updateProducts(updated);
    return updated;
  } catch (e) {
    console.error("decreaseStockBulk error", e);
    return false;
  }
}

/**
 * Finalize purchase:
 * - Validates stock for stored products (those with `stock` field)
 * - Decreases stock accordingly
 * - Creates & saves an Order
 * - Clears the cart
 *
 * Returns:
 *  { ok: true, order } on success
 *  { ok: false, reason: 'message' } on failure
 */
export async function finalizePurchase(
  paymentMethod: string, 
  shippingAddress: Address // ✅ ADICIONE: Receber endereço
): Promise<{ ok: true; order: Order } | { ok: false; reason: string }> {
  try {
    const cart = await getCart();
    if (!cart.length) return { ok: false, reason: "Carrinho vazio" };

    const products = await getProducts();
    const currentUser = await getCurrentUser();

    // build counts for stored products only
    const counts: Record<string, number> = {};
    for (const entry of cart) {
      counts[entry.id] = (counts[entry.id] || 0) + entry.quantity;
    }

    // verify stock
    for (const entry of cart) {
      const prod = products.find((p) => p.id === entry.id);
      if (prod && prod.stock !== undefined) {
        if (prod.stock < entry.quantity) {
          return { ok: false, reason: `Estoque insuficiente para ${prod.name} (tem ${prod.stock})` };
        }
      }
    }

    // decrease stock
    const updated = products.map((p) => {
      if (p.stock !== undefined && counts[p.id]) {
        return { ...p, stock: Math.max(0, p.stock - counts[p.id]) };
      }
      return p;
    });

    await updateProducts(updated);
    // ✅ ADICIONE: Registrar histórico de vendas para cada produto
    for (const entry of cart) {
      const product = updated.find(p => p.id === entry.id);
      if (product) {
        await addProductHistory(entry.id, {
          type: 'sold',
          by: currentUser?.id || 'system',
          details: {
            orderId: `order_${Date.now()}`,
            quantity: entry.quantity,
            price: product.price,
            customerName: currentUser?.name
          }
        });
      }
    }

    // compute total
    const total = cart.reduce((sum, c) => {
      const p = products.find((pp) => pp.id === c.id);
      return sum + (p ? p.price * c.quantity : 0);
    }, 0);

    const order: Order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total,
      paymentMethod,
      items: cart,
      userId: currentUser?.id || 'unknown',
      status: 'pending',
      customerName: currentUser?.name,
      customerEmail: currentUser?.email,
      // ✅ ADICIONE: Endereço de entrega
      shippingAddress: shippingAddress,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
    };

    await saveOrder(order);
    await clearCart();

    return { ok: true, order };
  } catch (e) {
    console.error("finalizePurchase error", e);
    return { ok: false, reason: "Erro interno ao finalizar compra" };
  }
}


export async function getProductsWithHistory(): Promise<StoredProduct[]> {
  try {
    const products = await getProducts();
    // Ordenar por data de criação (mais recentes primeiro)
    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Erro ao carregar produtos com histórico:', error);
    return [];
  }
}


export async function getTopSellingProducts(limit: number = 10): Promise<StoredProduct[]> {
  try {
    const products = await getProducts();
    return products
      .filter(p => (p.totalSold || 0) > 0)
      .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao carregar produtos mais vendidos:', error);
    return [];
  }
}


export async function getRecentlySoldProducts(limit: number = 10): Promise<StoredProduct[]> {
  try {
    const products = await getProducts();
    return products
      .filter(p => p.lastSoldAt)
      .sort((a, b) => new Date(b.lastSoldAt!).getTime() - new Date(a.lastSoldAt!).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao carregar produtos recentemente vendidos:', error);
    return [];
  }
}
  


/* ------------------------
   Small utilities
   ------------------------ */


export async function computeCartTotal(): Promise<{ total: number; detailed: Array<{ id: string; name?: string; price: number; quantity: number }>} > {
  try {
    const cart = await getCart();
    const products = await getProducts();
    let total = 0;
    const detailed: Array<{ id: string; name?: string; price: number; quantity: number }> = [];

    for (const entry of cart) {
      const p = products.find((pp) => pp.id === entry.id);
      const price = p ? p.price : 0;
      const name = p ? p.name : undefined;
      detailed.push({ id: entry.id, name, price, quantity: entry.quantity });
      total += price * entry.quantity;
    }

    return { total, detailed };
  } catch (e) {
    console.error("computeCartTotal error", e);
    return { total: 0, detailed: [] };
  }
}

/* ------------------------
   ADMIN DASHBOARD FUNCTIONS
   ------------------------ */


export async function getAdminStats() {
  try {
    const [users, products, orders] = await Promise.all([
      getUsers(),
      getProducts(),
      getOrders()
    ]);

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const preparingOrders = orders.filter(order => order.status === 'preparing').length;

    return {
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalSales,
      pendingOrders,
      preparingOrders,
      availableProducts: products.filter(p => p.stock && p.stock > 0).length,
      outOfStockProducts: products.filter(p => p.stock === 0).length,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return null;
  }
}


export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  try {
    const orders = await getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) return false;
    
    orders[orderIndex].status = status;
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return false;
  }
}


export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    const products = await getProducts();
    const filteredProducts = products.filter(p => p.id !== productId);
    await updateProducts(filteredProducts);
    return true;
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return false;
  }
}


export async function promoteToAdmin(userId: string): Promise<boolean> {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return false;
    
    users[userIndex].role = 'admin';
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Erro ao promover usuário:', error);
    return false;
  }
}


export async function getOrdersWithDetails(): Promise<(Order & { user?: User })[]> {
  try {
    const orders = await getOrders();
    const users = await getUsers();
    
    return orders.map(order => ({
      ...order,
      user: users.find(u => u.id === order.userId)
    }));
  } catch (error) {
    console.error('Erro ao obter pedidos com detalhes:', error);
    return [];
  }
}

export default {
  // auth & users
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  isAdmin,
  createDefaultAdmin,
  // users (antigo - manter compatibilidade)
  getUsers,
  clearUsers,
  // products
  getProducts,
  saveProduct,
  updateProducts,
  getStoredProductById,
  // cart
  getCart,
  setCart,
  addToCart,
  canAddToCart,
  removeOneFromCart,
  clearCart,
  // address
  
  // orders
  getOrders,
  saveOrder,
  // stock / finalize
  decreaseStockBulk,
  finalizePurchase,
  // utilities
  computeCartTotal,
};