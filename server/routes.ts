import { Router, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertTableSchema, insertOrderSchema, insertOrderItemSchema, insertSaleSchema, insertExpenseSchema } from "@shared/schema";
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
        role: 'admin'
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
      const tableData = insertTableSchema.parse(req.body);
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

  app.post("/api/orders", async (req, res) => {
    try {
      const { orderData, items } = req.body;
      
      // Valider les données de commande
      const validatedOrderData = insertOrderSchema.parse(orderData);
      
      // Créer la commande
      const order = await storage.createOrder(validatedOrderData);
      
      // Créer les éléments de commande
      if (items && items.length > 0) {
        for (const item of items) {
          const validatedItem = insertOrderItemSchema.parse({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          });
          await storage.createOrderItem(validatedItem);
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
      const order = await storage.updateOrder(Number(req.params.id), orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Si le statut est "completed" et le paiement est "paid", générer automatiquement une vente
      if (orderData.status === 'completed' && order.paymentStatus === 'paid') {
        try {
          const orderWithItems = await storage.getOrderWithItems(order.id);
          if (orderWithItems) {
            await storage.createSale({
              orderId: order.id,
              amount: order.total,
              paymentMethod: order.paymentMethod || 'cash',
              description: `Commande #${order.id} - ${orderWithItems.orderItems.map(item => item.product.name).join(', ')}`
            });
          }
        } catch (saleError) {
          console.error('Error creating sale for completed order:', saleError);
        }
      }
      
      res.json(order);
    } catch (error) {
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
  app.get("/api/menu/:tableId", async (req, res) => {
    try {
      const tableId = Number(req.params.tableId);
      const table = await storage.getTable(tableId);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      const categories = await storage.getCategories();
      const products = await storage.getProducts();

      res.json({
        table,
        categories,
        products: products.filter(p => p.available),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu" });
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

  const httpServer = createServer(app);
  return httpServer;
}