import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, ChefHat, Package, X } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface OrderNotificationProps {
  order: {
    id: number;
    status: string;
    customerName?: string;
    total: string;
    createdAt: string;
  };
  onClose?: () => void;
}

export function OrderNotification({ order, onClose }: OrderNotificationProps) {
  const [show, setShow] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShow(false);
    if (onClose) {
      setTimeout(onClose, 300); // Délai pour l'animation
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          text: "Confirmée",
          color: "bg-yellow-500",
          message: "Commande confirmée ! Nous préparons votre délicieux repas."
        };
      case "preparing":
        return {
          icon: ChefHat,
          text: "En préparation",
          color: "bg-blue-500",
          message: "Votre commande a été transmise au comptoir et est en préparation."
        };
      case "ready":
        return {
          icon: Package,
          text: "Prête",
          color: "bg-green-500",
          message: "Votre commande est prête ! Patientez un instant et vous serez servi."
        };
      case "completed":
        return {
          icon: CheckCircle,
          text: "Livrée",
          color: "bg-gray-500",
          message: "Commande livrée avec succès. Merci de votre visite !"
        };
      default:
        return {
          icon: Bell,
          text: "Mise à jour",
          color: "bg-gray-500",
          message: "Le statut de votre commande a été mis à jour."
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  if (!show) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 w-96 transition-all duration-300 ${
        show ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'
      }`}
    >
      <Card className="shadow-lg border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-4 w-4 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-sm">Commande #{order.id}</h4>
                <Badge className={`${statusInfo.color} text-white`}>
                  {statusInfo.text}
                </Badge>
              </div>
              
              {order.customerName && (
                <p className="text-sm text-gray-600 mb-1">{order.customerName}</p>
              )}
              
              <p className="text-sm text-gray-800 mb-2">{statusInfo.message}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Total: {formatCurrency(parseFloat(order.total))}</span>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Fermer la notification"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook pour écouter les mises à jour des commandes avec gestion robuste
export function useOrderNotifications(tableId?: number) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastOrderStatuses, setLastOrderStatuses] = useState<Record<number, string>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!tableId || tableId === 0) return;

    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/menu/${tableId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const currentOrders = data.orders || [];
        
        // Vérifier les changements de statut
        currentOrders.forEach((order: any) => {
          const previousStatus = lastOrderStatuses[order.id];
          
          if (previousStatus && previousStatus !== order.status && 
              (order.status === "preparing" || order.status === "ready" || order.status === "completed")) {
            
            const notificationId = `${order.id}-${order.status}-${Date.now()}`;
            
            setNotifications(prev => {
              // Éviter les doublons en vérifiant l'ID unique
              const exists = prev.some(n => n.notificationId === notificationId);
              if (!exists) {
                return [...prev, { 
                  ...order, 
                  notificationId,
                  timestamp: Date.now(),
                  isStatusChange: true 
                }];
              }
              return prev;
            });
          }
        });
        
        // Mettre à jour le cache des statuts
        const newStatuses: Record<number, string> = {};
        currentOrders.forEach((order: any) => {
          newStatuses[order.id] = order.status;
        });
        setLastOrderStatuses(newStatuses);
        
      } catch (error) {
        console.error("Erreur lors de la vérification des mises à jour:", error);
      }
    };

    // Vérification initiale après un délai
    const initialTimer = setTimeout(checkForUpdates, 1000);
    
    // Intervalle régulier
    intervalRef.current = setInterval(checkForUpdates, 8000);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tableId]);

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
  };

  return { notifications, removeNotification };
}