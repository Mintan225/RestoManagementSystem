// Configuration globale de l'application restaurant
export const APP_CONFIG = {
  // Informations du restaurant
  RESTAURANT: {
    NAME: process.env.RESTAURANT_NAME || "Restaurant Le Délice",
    ADDRESS: process.env.RESTAURANT_ADDRESS || "123 Avenue de la Paix, Abidjan",
    PHONE: process.env.RESTAURANT_PHONE || "+225 27 20 30 40 50",
    EMAIL: process.env.RESTAURANT_EMAIL || "contact@restaurant-delice.ci",
    WEBSITE: process.env.RESTAURANT_WEBSITE || "www.restaurant-delice.ci",
  },

  // Configuration des paiements Mobile Money
  PAYMENT: {
    // Orange Money
    ORANGE_MONEY: {
      ENABLED: process.env.ORANGE_MONEY_ENABLED === "true" || true,
      MERCHANT_ID: process.env.ORANGE_MONEY_MERCHANT_ID || "",
      API_KEY: process.env.ORANGE_MONEY_API_KEY || "",
      API_SECRET: process.env.ORANGE_MONEY_API_SECRET || "",
      WEBHOOK_URL: process.env.ORANGE_MONEY_WEBHOOK_URL || "",
      BASE_URL: process.env.ORANGE_MONEY_BASE_URL || "https://api.orange.com/orange-money-webpay/dev/v1",
    },

    // MTN Mobile Money
    MTN_MOMO: {
      ENABLED: process.env.MTN_MOMO_ENABLED === "true" || true,
      SUBSCRIPTION_KEY: process.env.MTN_MOMO_SUBSCRIPTION_KEY || "",
      API_USER_ID: process.env.MTN_MOMO_API_USER_ID || "",
      API_KEY: process.env.MTN_MOMO_API_KEY || "",
      TARGET_ENVIRONMENT: process.env.MTN_MOMO_TARGET_ENVIRONMENT || "sandbox",
      BASE_URL: process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com",
    },

    // Moov Money
    MOOV_MONEY: {
      ENABLED: process.env.MOOV_MONEY_ENABLED === "true" || true,
      MERCHANT_ID: process.env.MOOV_MONEY_MERCHANT_ID || "",
      API_KEY: process.env.MOOV_MONEY_API_KEY || "",
      API_SECRET: process.env.MOOV_MONEY_API_SECRET || "",
      BASE_URL: process.env.MOOV_MONEY_BASE_URL || "https://api.moov-africa.ci",
    },

    // Wave
    WAVE: {
      ENABLED: process.env.WAVE_ENABLED === "true" || true,
      API_KEY: process.env.WAVE_API_KEY || "",
      SECRET_KEY: process.env.WAVE_SECRET_KEY || "",
      MERCHANT_ID: process.env.WAVE_MERCHANT_ID || "",
      BASE_URL: process.env.WAVE_BASE_URL || "https://api.wave.com",
    },

    // Configuration générale
    CURRENCY: "FCFA",
    CURRENCY_CODE: "XOF",
    DEFAULT_METHOD: "cash",
    TIMEOUT: parseInt(process.env.PAYMENT_TIMEOUT || "30000"), // 30 secondes
  },

  // Configuration des taxes et frais
  BUSINESS: {
    TAX_RATE: parseFloat(process.env.TAX_RATE || "18"), // TVA 18%
    SERVICE_CHARGE: parseFloat(process.env.SERVICE_CHARGE || "10"), // Frais de service 10%
    DELIVERY_FEE: parseFloat(process.env.DELIVERY_FEE || "1000"), // Frais de livraison 1000 FCFA
    MINIMUM_ORDER: parseFloat(process.env.MINIMUM_ORDER || "2000"), // Commande minimum 2000 FCFA
  },

  // Configuration des notifications
  NOTIFICATIONS: {
    SMS_ENABLED: process.env.SMS_ENABLED === "true" || false,
    EMAIL_ENABLED: process.env.EMAIL_ENABLED === "true" || false,
    PUSH_ENABLED: process.env.PUSH_ENABLED === "true" || true,
    
    // Configuration SMS (via services locaux)
    SMS_PROVIDER: process.env.SMS_PROVIDER || "nexah", // nexah, smsgh, etc.
    SMS_API_KEY: process.env.SMS_API_KEY || "",
    SMS_SENDER_ID: process.env.SMS_SENDER_ID || "RESTAURANT",
  },

  // Configuration des QR codes
  QR_CODE: {
    BASE_URL: process.env.QR_BASE_URL || "https://restaurant-app.replit.app",
    LOGO_URL: process.env.QR_LOGO_URL || "",
    SIZE: parseInt(process.env.QR_SIZE || "256"),
    MARGIN: parseInt(process.env.QR_MARGIN || "4"),
  },

  // Configuration de sécurité
  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET || "restaurant-secret-key-change-in-production",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
    SESSION_SECRET: process.env.SESSION_SECRET || "session-secret-change-in-production",
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12"),
  },

  // Configuration de la base de données
  DATABASE: {
    URL: process.env.DATABASE_URL || "",
    POOL_SIZE: parseInt(process.env.DB_POOL_SIZE || "10"),
    TIMEOUT: parseInt(process.env.DB_TIMEOUT || "30000"),
  },

  // Configuration de l'application
  APP: {
    PORT: parseInt(process.env.PORT || "5000"),
    NODE_ENV: process.env.NODE_ENV || "development",
    BASE_URL: process.env.BASE_URL || "http://localhost:5000",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    
    // Langue par défaut
    DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || "fr",
    TIMEZONE: process.env.TIMEZONE || "Africa/Abidjan",
  },

  // Configuration des fichiers
  FILES: {
    UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB
    ALLOWED_TYPES: (process.env.ALLOWED_FILE_TYPES || "image/jpeg,image/png,image/gif,application/pdf").split(","),
  },

  // Configuration des logs
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || "info",
    FILE_ENABLED: process.env.LOG_FILE_ENABLED === "true" || false,
    FILE_PATH: process.env.LOG_FILE_PATH || "logs/app.log",
  },
} as const;

// Types pour la configuration
export type PaymentMethod = "cash" | "orange_money" | "mtn_momo" | "moov_money" | "wave";

export interface PaymentConfig {
  method: PaymentMethod;
  amount: number;
  currency?: string;
  description?: string;
  customerPhone?: string;
  customerName?: string;
  orderId?: string;
}

// Validation de la configuration
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Vérification des variables critiques
  if (!APP_CONFIG.DATABASE.URL) {
    errors.push("DATABASE_URL est requis");
  }
  
  if (APP_CONFIG.SECURITY.JWT_SECRET === "restaurant-secret-key-change-in-production" && 
      APP_CONFIG.APP.NODE_ENV === "production") {
    errors.push("JWT_SECRET doit être changé en production");
  }
  
  if (APP_CONFIG.SECURITY.SESSION_SECRET === "session-secret-change-in-production" && 
      APP_CONFIG.APP.NODE_ENV === "production") {
    errors.push("SESSION_SECRET doit être changé en production");
  }

  // Vérification des configurations de paiement Mobile Money
  if (APP_CONFIG.PAYMENT.ORANGE_MONEY.ENABLED && !APP_CONFIG.PAYMENT.ORANGE_MONEY.API_KEY) {
    errors.push("ORANGE_MONEY_API_KEY est requis quand Orange Money est activé");
  }
  
  if (APP_CONFIG.PAYMENT.MTN_MOMO.ENABLED && !APP_CONFIG.PAYMENT.MTN_MOMO.SUBSCRIPTION_KEY) {
    errors.push("MTN_MOMO_SUBSCRIPTION_KEY est requis quand MTN MoMo est activé");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper pour obtenir les méthodes de paiement disponibles
export function getAvailablePaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = ["cash"]; // Cash toujours disponible
  
  if (APP_CONFIG.PAYMENT.ORANGE_MONEY.ENABLED) methods.push("orange_money");
  if (APP_CONFIG.PAYMENT.MTN_MOMO.ENABLED) methods.push("mtn_momo");
  if (APP_CONFIG.PAYMENT.MOOV_MONEY.ENABLED) methods.push("moov_money");
  if (APP_CONFIG.PAYMENT.WAVE.ENABLED) methods.push("wave");
  
  return methods;
}

// Helper pour obtenir le label d'une méthode de paiement
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cash: "Espèces",
    orange_money: "Orange Money",
    mtn_momo: "MTN Mobile Money",
    moov_money: "Moov Money",
    wave: "Wave"
  };
  
  return labels[method] || method;
}

// Helper pour vérifier si une méthode de paiement est activée
export function isPaymentMethodEnabled(method: PaymentMethod): boolean {
  switch (method) {
    case "cash":
      return true; // Cash toujours disponible
    case "orange_money":
      return APP_CONFIG.PAYMENT.ORANGE_MONEY.ENABLED;
    case "mtn_momo":
      return APP_CONFIG.PAYMENT.MTN_MOMO.ENABLED;
    case "moov_money":
      return APP_CONFIG.PAYMENT.MOOV_MONEY.ENABLED;
    case "wave":
      return APP_CONFIG.PAYMENT.WAVE.ENABLED;
    default:
      return false;
  }
}