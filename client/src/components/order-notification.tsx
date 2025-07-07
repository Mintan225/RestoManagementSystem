import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, ChefHat, Package } from "lucide-react";
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
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }, 300); // Attendre la fin de l'animation
    }, 5000); // Disparaît après 5 secondes

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          text: "En attente",
          color: "bg-yellow-500",
          message: "Votre commande a été reçue et est en attente de préparation"
        };
      case "preparing":
        return {
          icon: ChefHat,
          text: "En préparation",
          color: "bg-blue-500",
          message: "Votre commande est en cours de préparation"
        };
      case "ready":
        return {
          icon: Package,
          text: "Prête",
          color: "bg-green-500",
          message: "Votre commande est prête ! Vous pouvez venir la récupérer"
        };
      case "completed":
        return {
          icon: CheckCircle,
          text: "Terminée",
          color: "bg-gray-500",
          message: "Votre commande a été livrée. Merci !"
        };
      default:
        return {
          icon: Bell,
          text: "Mise à jour",
          color: "bg-gray-500",
          message: "Statut de votre commande mis à jour"
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  if (!isVisible) return null;

  return (
    <Card className={`fixed top-4 right-4 z-50 w-96 shadow-lg border-l-4 border-l-primary transition-all duration-300 ${
        isAnimating ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
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
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook pour écouter les mises à jour des commandes
export function useOrderNotifications(tableId?: number) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [lastOrderStatuses, setLastOrderStatuses] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (!tableId) return;

    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/menu/${tableId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const currentOrders = data.orders || [];
        
        // Vérifier les changements de statut des commandes existantes
        currentOrders.forEach((order: any) => {
          const previousStatus = lastOrderStatuses.get(order.id);
          
          // Si le statut a changé vers "preparing" ou "ready"
          if (previousStatus && previousStatus !== order.status && 
              (order.status === "preparing" || order.status === "ready")) {
            
            const notificationId = `${order.id}-${order.status}-${Date.now()}`;
            setNotifications(prev => {
              // Éviter les doublons
              const exists = prev.some(n => n.id === order.id && n.status === order.status);
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
          
          // Mettre à jour le statut dans notre cache
          setLastOrderStatuses(prev => new Map(prev.set(order.id, order.status)));
        });
        
        // Vérifier les nouvelles commandes
        if (currentOrders.length > lastOrderCount) {
          const newOrders = currentOrders.slice(lastOrderCount);
          newOrders.forEach((newOrder: any) => {
            const notificationId = `${newOrder.id}-new-${Date.now()}`;
            setNotifications(prev => [...prev, { 
              ...newOrder, 
              notificationId,
              isNew: true, 
              timestamp: Date.now() 
            }]);
          });
        }
        
        setLastOrderCount(currentOrders.length);
      } catch (error) {
        console.error("Erreur lors de la vérification des mises à jour:", error);
      }
    };

    // Vérification initiale
    checkForUpdates();
    
    const interval = setInterval(checkForUpdates, 8000); // Vérifier toutes les 8 secondes

    return () => clearInterval(interval);
  }, [tableId, lastOrderCount, lastOrderStatuses]);

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
  };

  return { notifications, removeNotification };
}