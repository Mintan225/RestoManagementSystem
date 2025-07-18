import { Router, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertTableSchema, insertOrderSchema, insertOrderItemSchema, insertSaleSchema, insertExpenseSchema, insertSuperAdminSchema } from "@shared/schema";
import { DEFAULT_PERMISSIONS, type UserRole } from "@shared/permissions";
import { storage } from "./storage";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { APP_CONFIG, PaymentConfig, getAvailablePaymentMethods, getPaymentMethodLabel, isPaymentMethodEnabled } from "@shared/config";
import { PaymentService } from "./payment-service";

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, APP_CONFIG.SECURITY.JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please login again.' });
      }
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Users management routes
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateToken, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Assigner les permissions par défaut si aucune permission n'est fournie ou si le tableau est vide
      const defaultPermissions = {
        admin: [
          "products.view", "products.create", "products.edit", "products.delete", "products.archive",
          "categories.view", "categories.create", "categories.edit", "categories.delete",
          "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.update_status",
          "sales.view", "sales.create", "sales.delete", "sales.export",
          "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
          "tables.view", "tables.create", "tables.edit", "tables.delete", "tables.generate_qr",
          "analytics.view", "analytics.export",
          "users.view", "users.create", "users.edit", "users.delete", "users.manage_permissions",
          "config.view", "config.edit", "config.payment_methods",
          "archives.view", "archives.restore"
        ],
        manager: [
          "products.view", "products.create", "products.edit", "products.delete", "products.archive",
          "categories.view", "categories.create", "categories.edit", "categories.delete",
          "orders.view", "orders.create", "orders.edit", "orders.update_status",
          "sales.view", "sales.create", "sales.delete", "sales.export",
          "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
          "tables.view", "tables.create", "tables.edit", "tables.generate_qr",
          "analytics.view", "analytics.export",
          "users.view", "users.create", "users.edit",
          "config.view", "config.edit",
          "archives.view", "archives.restore"
        ],
        employee: [
          "products.view",
          "categories.view",
          "orders.view", "orders.create", "orders.update_status",
          "sales.view", "sales.create",
          "expenses.view", "expenses.create",
          "tables.view",
          "analytics.view"
        ],
        cashier: [
          "products.view",
          "categories.view",
          "orders.view", "orders.update_status",
          "sales.view", "sales.create", "sales.export",
          "tables.view",
          "analytics.view"
        ]
      };
      
      const permissions = (userData.permissions && userData.permissions.length > 0) 
        ? userData.permissions 
        : defaultPermissions[userData.role] || [];
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        permissions,
      });
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const user = await storage.updateUser(Number(req.params.id), userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteUser(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userData = insertUserSchema.parse({
        username,
        password: hashedPassword,
        fullName: username,
        role: 'admin',
        permissions: ['products.view', 'products.create', 'products.edit', 'products.delete', 'products.archive', 'categories.view', 'categories.create', 'categories.edit', 'categories.delete', 'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.update_status', 'sales.view', 'sales.create', 'sales.delete', 'sales.export', 'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete', 'tables.view', 'tables.create', 'tables.edit', 'tables.delete', 'tables.generate_qr', 'analytics.view', 'analytics.export', 'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_permissions', 'config.view', 'config.edit', 'config.payment_methods', 'archives.view', 'archives.restore']
      });

      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        APP_CONFIG.SECURITY.JWT_SECRET,
        { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        APP_CONFIG.SECURITY.JWT_SECRET,
        { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(Number(req.params.id), categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteCategory(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId } = req.query;
      let products;
      
      if (categoryId) {
        products = await storage.getProductsByCategory(Number(categoryId));
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteProduct(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      if (error instanceof Error && error.message.includes("used in orders")) {
        return res.status(400).json({ 
          message: "Cannot delete product that is used in orders",
          error: error.message 
        });
      }
      res.status(500).json({ 
        message: "Failed to delete product", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Tables routes
  app.get("/api/tables", async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.get("/api/tables/:id", async (req, res) => {
    try {
      const table = await storage.getTable(Number(req.params.id));
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table" });
    }
  });

  app.post("/api/tables", authenticateToken, async (req, res) => {
    try {
      const { number, capacity } = req.body;
      
      // Générer automatiquement le QR code
      const qrCode = `https://${req.headers.host}/table/${number}`;
      
      const tableData = {
        number: parseInt(number),
        capacity: parseInt(capacity),
        qrCode: qrCode,
        status: "available"
      };
      
      const table = await storage.createTable(tableData);
      res.json(table);
    } catch (error) {
      console.error("Error creating table:", error);
      res.status(500).json({ message: "Failed to create table", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/tables/:id", authenticateToken, async (req, res) => {
    try {
      const tableData = insertTableSchema.partial().parse(req.body);
      const table = await storage.updateTable(Number(req.params.id), tableData);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  // Orders routes
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const { active } = req.query;
      let orders;
      
      if (active === 'true') {
        orders = await storage.getActiveOrders();
      } else {
        orders = await storage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderWithItems(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Route publique pour les commandes client (sans authentification)
  app.post("/api/orders", async (req, res) => {
    try {
      const { tableId, customerName, customerPhone, orderItems, paymentMethod, notes } = req.body;
      
      // Calculer le total à partir des items
      const total = orderItems.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
      
      const orderData = {
        tableId: parseInt(tableId),
        customerName,
        customerPhone,
        paymentMethod: paymentMethod || "cash",
        total: total.toString(),
        notes: notes || null,
        status: "pending",
        paymentStatus: "pending"
      };
      
      const order = await storage.createOrder(orderData);
      
      // Mettre à jour le statut de la table comme "occupied" quand une commande est créée
      try {
        await storage.updateTable(parseInt(tableId), { status: "occupied" });
      } catch (error) {
        console.error("Error updating table status:", error);
      }
      
      // Créer les items de la commande
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            price: item.price.toString(),
            notes: item.notes || null
          });
        }
      }
      
      // Retourner la commande avec ses éléments
      const orderWithItems = await storage.getOrderWithItems(order.id);
      res.json(orderWithItems);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      
      // Si la commande passe au statut "completed", marquer automatiquement le paiement comme "paid"
      if (orderData.status === 'completed') {
        orderData.paymentStatus = 'paid';
        orderData.completedAt = new Date();

      }
      
      const order = await storage.updateOrder(Number(req.params.id), orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Mettre à jour le statut de la table quand la commande change
      if (orderData.status) {
        try {
          let tableStatus = "available";
          if (orderData.status === 'completed' || orderData.status === 'cancelled') {
            // Vérifier s'il y a d'autres commandes actives pour cette table
            const activeOrders = await storage.getActiveOrders();
            const otherActiveOrders = activeOrders.filter((o: any) => 
              o.tableId === order.tableId && 
              o.id !== order.id && 
              o.status !== 'completed' && 
              o.status !== 'cancelled'
            );
            
            if (otherActiveOrders.length === 0) {
              tableStatus = "available";
            } else {
              tableStatus = "occupied";
            }
          } else {
            tableStatus = "occupied";
          }
          
          await storage.updateTable(order.tableId, { status: tableStatus });
        } catch (error) {
          console.error("Error updating table status:", error);
        }
      }
      
      // Si le statut est "completed" et le paiement est "paid", générer automatiquement une vente
      if (orderData.status === 'completed' && orderData.paymentStatus === 'paid') {
        try {
          const orderWithItems = await storage.getOrderWithItems(order.id);
          if (orderWithItems) {
            // Vérifier si une vente existe déjà pour cette commande
            const existingSales = await storage.getSales();
            const existingSale = existingSales.find(sale => sale.orderId === order.id);
            
            if (!existingSale) {
              await storage.createSale({
                orderId: order.id,
                amount: order.total,
                paymentMethod: order.paymentMethod || 'cash',
                description: `Commande #${order.id} - ${orderWithItems.orderItems.map(item => item.product.name).join(', ')}`
              });
              console.log(`Vente automatiquement créée pour la commande #${order.id}`);
            } else {
              console.log(`Vente déjà existante pour la commande #${order.id}`);
            }
          }
        } catch (saleError) {
          console.error('Error creating sale for completed order:', saleError);
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Route pour générer et télécharger un reçu
  app.get("/api/orders/:id/receipt", async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const orderWithItems = await storage.getOrderWithItems(orderId);
      
      if (!orderWithItems) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Vérifier que la commande est payée
      if (orderWithItems.paymentStatus !== 'paid') {
        return res.status(400).json({ message: "Order is not paid yet" });
      }
      
      const receiptData = {
        orderId: orderWithItems.id,
        customerName: orderWithItems.customerName || 'Client',
        customerPhone: orderWithItems.customerPhone,
        tableNumber: orderWithItems.tableId,
        items: orderWithItems.orderItems.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.price) * item.quantity
        })),
        subtotal: parseFloat(orderWithItems.total),
        total: parseFloat(orderWithItems.total),
        paymentMethod: orderWithItems.paymentMethod || 'Espèces',
        paymentDate: orderWithItems.createdAt,
        restaurantName: 'Mon Restaurant',
        restaurantAddress: 'Adresse du restaurant', 
        restaurantPhone: '+225 XX XX XX XX'
      };
      
      res.json(receiptData);
    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  });

  // Order Items routes
  app.post("/api/order-items", async (req, res) => {
    try {
      const orderItemData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(orderItemData);
      res.json(orderItem);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Sales routes
  app.get("/api/sales", authenticateToken, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", authenticateToken, async (req, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(saleData);
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/sales/:id", authenticateToken, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteSale(id);
      if (deleted) {
        res.json({ message: "Sale deleted successfully" });
      } else {
        res.status(404).json({ message: "Sale not found" });
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteOrder(id);
      if (deleted) {
        res.json({ message: "Order deleted successfully" });
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Archives routes
  app.get("/api/archives/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getDeletedOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching deleted orders:", error);
      res.status(500).json({ message: "Failed to fetch deleted orders" });
    }
  });

  app.get("/api/archives/sales", authenticateToken, async (req, res) => {
    try {
      const sales = await storage.getDeletedSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching deleted sales:", error);
      res.status(500).json({ message: "Failed to fetch deleted sales" });
    }
  });

  app.get("/api/archives/expenses", authenticateToken, async (req, res) => {
    try {
      const expenses = await storage.getDeletedExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching deleted expenses:", error);
      res.status(500).json({ message: "Failed to fetch deleted expenses" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(Number(req.params.id), expenseData);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteExpense(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/daily", authenticateToken, async (req, res) => {
    try {
      const today = new Date();
      const stats = await storage.getDailyStats(today);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/weekly", authenticateToken, async (req, res) => {
    try {
      const weeklyStats = await storage.getWeeklyStats();
      res.json(weeklyStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Menu routes (public, no auth required)
  app.get("/api/menu/:tableNumber", async (req, res) => {
    try {
      const tableNumber = Number(req.params.tableNumber);
      const table = await storage.getTableByNumber(tableNumber);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      const categories = await storage.getCategories();
      const products = await storage.getProducts();
      
      // Get recent orders for this table for notification tracking
      const orders = await storage.getOrders();
      const tableOrders = orders.filter(o => o.tableId === table.id);

      res.json({
        table,
        categories,
        products: products.filter(p => p.available),
        orders: tableOrders,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // Route pour corriger les QR codes incohérents  
  app.post("/api/admin/fix-qr-codes", authenticateToken, async (req, res) => {
    try {
      const tables = await storage.getTables();
      let fixedCount = 0;
      
      for (const table of tables) {
        // Vérifier si le QR code contient "/menu/" au lieu de "/table/"
        if (table.qrCode && table.qrCode.includes('/menu/')) {
          const correctQrCode = table.qrCode.replace('/menu/', '/table/');
          await storage.updateTable(table.id, { qrCode: correctQrCode });
          fixedCount++;
        }
      }
      
      res.json({ 
        message: `Fixed ${fixedCount} QR codes`,
        fixed: fixedCount,
        total: tables.length 
      });
    } catch (error) {
      console.error("Error fixing QR codes:", error);
      res.status(500).json({ message: "Failed to fix QR codes" });
    }
  });

  // Route pour regénérer TOUS les QR codes avec le bon format
  app.put("/api/admin/regenerate-qr-codes", authenticateToken, async (req, res) => {
    try {
      const tables = await storage.getTables();
      let updatedCount = 0;
      
      for (const table of tables) {
        // Regénérer QR code avec format correct /table/
        const correctQrCode = `https://${req.headers.host}/table/${table.number}`;
        await storage.updateTable(table.id, { qrCode: correctQrCode });
        updatedCount++;
      }
      
      res.json({ 
        message: `Regenerated ${updatedCount} QR codes`,
        updated: updatedCount,
        total: tables.length 
      });
    } catch (error) {
      console.error("Error regenerating QR codes:", error);
      res.status(500).json({ message: "Failed to regenerate QR codes" });
    }
  });

  // Configuration routes
  app.get("/api/config", (req, res) => {
    try {
      res.json({
        restaurant: APP_CONFIG.RESTAURANT,
        paymentMethods: getAvailablePaymentMethods().map(method => ({
          id: method,
          label: getPaymentMethodLabel(method),
          enabled: isPaymentMethodEnabled(method)
        })),
        business: APP_CONFIG.BUSINESS,
        app: {
          name: APP_CONFIG.RESTAURANT.NAME,
          version: "1.0.0",
          environment: APP_CONFIG.APP.NODE_ENV
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // Payment routes
  app.post("/api/payments/initiate", async (req, res) => {
    try {
      const paymentConfig: PaymentConfig = req.body;
      
      // Validation des données de paiement
      if (!paymentConfig.method || !paymentConfig.amount) {
        return res.status(400).json({ message: "Method and amount are required" });
      }

      if (!isPaymentMethodEnabled(paymentConfig.method)) {
        return res.status(400).json({ message: "Payment method not enabled" });
      }

      const result = await PaymentService.initiatePayment(paymentConfig);
      res.json(result);
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to initiate payment",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/payments/status/:method/:transactionId", async (req, res) => {
    try {
      const { method, transactionId } = req.params;
      
      if (!isPaymentMethodEnabled(method as any)) {
        return res.status(400).json({ message: "Payment method not enabled" });
      }

      const status = await PaymentService.checkPaymentStatus(method as any, transactionId);
      res.json(status);
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ 
        message: "Failed to check payment status",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Webhooks pour les paiements Mobile Money
  app.post("/api/webhooks/orange-money", async (req, res) => {
    try {
      const result = await PaymentService.processWebhook("orange_money", req.body);
      res.json(result);
    } catch (error) {
      console.error("Orange Money webhook error:", error);
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/webhooks/mtn-momo", async (req, res) => {
    try {
      const result = await PaymentService.processWebhook("mtn_momo", req.body);
      res.json(result);
    } catch (error) {
      console.error("MTN MoMo webhook error:", error);
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/webhooks/moov-money", async (req, res) => {
    try {
      const result = await PaymentService.processWebhook("moov_money", req.body);
      res.json(result);
    } catch (error) {
      console.error("Moov Money webhook error:", error);
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/webhooks/wave", async (req, res) => {
    try {
      const result = await PaymentService.processWebhook("wave", req.body);
      res.json(result);
    } catch (error) {
      console.error("Wave webhook error:", error);
      res.status(500).json({ success: false });
    }
  });

  // Middleware d'authentification pour super admin
  function authenticateSuperAdmin(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, APP_CONFIG.SECURITY.SUPER_ADMIN_JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      req.superAdmin = decoded;
      next();
    });
  }

  // Routes Super Admin
  app.post('/api/super-admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const superAdmin = await storage.getSuperAdminByUsername(username);
      if (!superAdmin) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }

      const validPassword = await bcrypt.compare(password, superAdmin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }

      const token = jwt.sign(
        { id: superAdmin.id, username: superAdmin.username, type: 'super_admin' },
        APP_CONFIG.SECURITY.SUPER_ADMIN_JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token, superAdmin: { id: superAdmin.id, username: superAdmin.username, fullName: superAdmin.fullName } });
    } catch (error) {
      console.error("Super admin login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get('/api/super-admin/profile', authenticateSuperAdmin, async (req: any, res) => {
    try {
      const superAdmin = await storage.getSuperAdmin(req.superAdmin.id);
      if (!superAdmin) {
        return res.status(404).json({ message: "Super admin not found" });
      }
      
      res.json({
        id: superAdmin.id,
        username: superAdmin.username,
        fullName: superAdmin.fullName,
        email: superAdmin.email,
        phone: superAdmin.phone
      });
    } catch (error) {
      console.error("Super admin profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post('/api/super-admin/create-admin', authenticateSuperAdmin, async (req, res) => {
    try {
      const adminData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const newAdmin = await storage.createUser({
        ...adminData,
        password: hashedPassword,
        role: "admin",
        permissions: []
      });

      res.json({
        id: newAdmin.id,
        username: newAdmin.username,
        fullName: newAdmin.fullName,
        role: newAdmin.role
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Super Admin Management routes
  app.delete("/api/super-admin/products/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProduct(Number(req.params.id));
      if (success) {
        res.json({ message: "Product deleted successfully" });
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.delete("/api/super-admin/orders/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const success = await storage.deleteOrder(Number(req.params.id));
      if (success) {
        res.json({ message: "Order deleted successfully" });
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  app.delete("/api/super-admin/sales/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const success = await storage.deleteSale(Number(req.params.id));
      if (success) {
        res.json({ message: "Sale deleted successfully" });
      } else {
        res.status(404).json({ message: "Sale not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  app.delete("/api/super-admin/expenses/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const success = await storage.deleteExpense(Number(req.params.id));
      if (success) {
        res.json({ message: "Expense deleted successfully" });
      } else {
        res.status(404).json({ message: "Expense not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  app.delete("/api/super-admin/tables/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const success = await storage.deleteTable(Number(req.params.id));
      if (success) {
        res.json({ message: "Table deleted successfully" });
      } else {
        res.status(404).json({ message: "Table not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete table" });
    }
  });

  app.delete("/api/super-admin/users/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUser(Number(req.params.id));
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Super Admin data viewing route
  app.get("/api/super-admin/all-data", authenticateSuperAdmin, async (req, res) => {
    try {
      const [products, orders, sales, expenses, tables, users] = await Promise.all([
        storage.getProducts(),
        storage.getOrders(),
        storage.getSales(),
        storage.getExpenses(),
        storage.getTables(),
        storage.getUsers()
      ]);

      res.json({
        products,
        orders,
        sales,
        expenses,
        tables,
        users
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch data" });
    }
  });

  app.post('/api/super-admin/reset-system', authenticateSuperAdmin, async (req, res) => {
    try {
      await storage.resetAllData();
      res.json({ message: "System reset successfully" });
    } catch (error) {
      console.error("System reset error:", error);
      res.status(500).json({ message: "Failed to reset system" });
    }
  });

  // System tabs management
  app.get("/api/super-admin/system-tabs", authenticateSuperAdmin, async (req, res) => {
    try {
      const tabs = await storage.getSystemTabs();
      res.json(tabs);
    } catch (error) {
      console.error("Erreur lors de la récupération des onglets:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/super-admin/system-tabs", authenticateSuperAdmin, async (req, res) => {
    try {
      const tab = await storage.createSystemTab(req.body);
      res.json(tab);
    } catch (error) {
      console.error("Erreur lors de la création de l'onglet:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/super-admin/system-tabs/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tab = await storage.updateSystemTab(id, req.body);
      if (!tab) {
        return res.status(404).json({ message: "Onglet non trouvé" });
      }
      res.json(tab);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'onglet:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/super-admin/system-tabs/:id", authenticateSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSystemTab(id);
      if (!deleted) {
        return res.status(404).json({ message: "Onglet non trouvé" });
      }
      res.json({ message: "Onglet supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'onglet:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/super-admin/system-tabs/:id/toggle", authenticateSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const toggled = await storage.toggleSystemTab(id);
      if (!toggled) {
        return res.status(404).json({ message: "Onglet non trouvé" });
      }
      res.json({ message: "Statut de l'onglet modifié avec succès" });
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // System updates management
  app.get("/api/super-admin/system-updates", authenticateSuperAdmin, async (req, res) => {
    try {
      const updates = await storage.getSystemUpdates();
      res.json(updates);
    } catch (error) {
      console.error("Erreur lors de la récupération des mises à jour:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/super-admin/system-updates", authenticateSuperAdmin, async (req, res) => {
    try {
      const update = await storage.createSystemUpdate(req.body);
      res.json(update);
    } catch (error) {
      console.error("Erreur lors de la création de la mise à jour:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/super-admin/system-updates/:id/deploy", authenticateSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deployed = await storage.deploySystemUpdate(id);
      if (!deployed) {
        return res.status(404).json({ message: "Mise à jour non trouvée" });
      }
      res.json({ message: "Mise à jour déployée avec succès" });
    } catch (error) {
      console.error("Erreur lors du déploiement de la mise à jour:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // System settings management
  app.get("/api/super-admin/system-settings", authenticateSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/super-admin/system-settings/:key", authenticateSuperAdmin, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Paramètre non trouvé" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Erreur lors de la récupération du paramètre:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/super-admin/system-settings", authenticateSuperAdmin, async (req, res) => {
    try {
      const setting = await storage.createSystemSetting(req.body);
      res.json(setting);
    } catch (error) {
      console.error("Erreur lors de la création du paramètre:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/super-admin/system-settings/:key", authenticateSuperAdmin, async (req, res) => {
    try {
      const { value } = req.body;
      const setting = await storage.updateSystemSetting(req.params.key, value);
      if (!setting) {
        return res.status(404).json({ message: "Paramètre non trouvé" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paramètre:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}