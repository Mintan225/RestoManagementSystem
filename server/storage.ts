import { 
  users, categories, products, tables, orders, orderItems, sales, expenses,
  type User, type InsertUser, type Category, type InsertCategory,
  type Product, type InsertProduct, type Table, type InsertTable,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Sale, type InsertSale, type Expense, type InsertExpense
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, ne, isNull, isNotNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Tables
  getTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  getTableByNumber(number: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;

  // Orders
  getOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getActiveOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getDeletedOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Sales
  getSales(): Promise<Sale[]>;
  getDeletedSales(): Promise<Sale[]>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  deleteSale(id: number): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getDeletedExpenses(): Promise<Expense[]>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Analytics
  getDailyStats(date: Date): Promise<{
    totalSales: number;
    totalExpenses: number;
    profit: number;
    orderCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.archived, false))
      .orderBy(products.name);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      // First check if the product exists
      const [product] = await db.select().from(products).where(eq(products.id, id));
      if (!product) {
        return false;
      }

      // Check if product is used in any order items
      const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.productId, id));
      if (orderItem) {
        // Instead of deleting, archive the product
        const [archived] = await db.update(products)
          .set({ archived: true, available: false })
          .where(eq(products.id, id))
          .returning();
        return !!archived;
      }

      // If not used in orders, delete permanently
      const result = await db.delete(products).where(eq(products.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return await db.select().from(tables).orderBy(tables.number);
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table || undefined;
  }

  async getTableByNumber(number: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.number, number));
    return table || undefined;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const [updated] = await db.update(tables)
      .set(table)
      .where(eq(tables.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTable(id: number): Promise<boolean> {
    const result = await db.delete(tables).where(eq(tables.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Orders
  async getOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const ordersData = await db.select().from(orders)
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, orderItems: items };
      })
    );
    
    return ordersWithItems;
  }

  async getDeletedOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const ordersData = await db.select().from(orders)
      .where(isNotNull(orders.deletedAt))
      .orderBy(desc(orders.deletedAt));
    
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, orderItems: items };
      })
    );
    
    return ordersWithItems;
  }

  async getActiveOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const activeOrdersData = await db.select().from(orders)
      .where(and(
        ne(orders.status, 'completed'),
        ne(orders.status, 'cancelled')
      ))
      .orderBy(desc(orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      activeOrdersData.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, orderItems: items };
      })
    );
    
    return ordersWithItems;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderWithItems(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = await this.getOrderItems(id);
    return { ...order, orderItems: items };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Ensure total is provided
    const orderWithTotal = {
      ...order,
      total: order.total || "0.00"
    };
    const [newOrder] = await db.insert(orders).values(orderWithTotal).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    // Ensure total is provided for updates, filtering out undefined values
    const updateData = Object.fromEntries(
      Object.entries(order).filter(([_, value]) => value !== undefined)
    );
    
    const [updated] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.update(orders)
      .set({ deletedAt: new Date() })
      .where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        notes: orderItems.notes,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updated] = await db.update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(isNull(sales.deletedAt))
      .orderBy(desc(sales.createdAt));
  }

  async getDeletedSales(): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(isNotNull(sales.deletedAt))
      .orderBy(desc(sales.deletedAt));
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(and(
        gte(sales.createdAt, startDate),
        lte(sales.createdAt, endDate)
      ))
      .orderBy(desc(sales.createdAt));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    return newSale;
  }

  async deleteSale(id: number): Promise<boolean> {
    const result = await db.update(sales)
      .set({ deletedAt: new Date() })
      .where(eq(sales.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(isNull(expenses.deletedAt))
      .orderBy(desc(expenses.createdAt));
  }

  async getDeletedExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(isNotNull(expenses.deletedAt))
      .orderBy(desc(expenses.deletedAt));
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(and(
        gte(expenses.createdAt, startDate),
        lte(expenses.createdAt, endDate)
      ))
      .orderBy(desc(expenses.createdAt));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.update(expenses)
      .set({ deletedAt: new Date() })
      .where(eq(expenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics
  async getDailyStats(date: Date): Promise<{
    totalSales: number;
    totalExpenses: number;
    profit: number;
    orderCount: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const salesData = await db.select({
      total: sum(sales.amount),
      count: sum(sales.amount).mapWith(Number)
    }).from(sales)
      .where(and(
        gte(sales.createdAt, startOfDay),
        lte(sales.createdAt, endOfDay)
      ));

    const expensesData = await db.select({
      total: sum(expenses.amount)
    }).from(expenses)
      .where(and(
        gte(expenses.createdAt, startOfDay),
        lte(expenses.createdAt, endOfDay)
      ));

    const ordersData = await db.select().from(orders)
      .where(and(
        gte(orders.createdAt, startOfDay),
        lte(orders.createdAt, endOfDay)
      ));

    const totalSales = Number(salesData[0]?.total || 0);
    const totalExpenses = Number(expensesData[0]?.total || 0);
    const orderCount = ordersData.length;
    const profit = totalSales - totalExpenses;

    return {
      totalSales,
      totalExpenses,
      profit,
      orderCount,
    };
  }
}

export const storage = new DatabaseStorage();
