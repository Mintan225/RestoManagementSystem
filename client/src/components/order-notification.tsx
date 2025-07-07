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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 10000); // Notification disparaît après 10 secondes

    return () => clearTimeout(timer);
  }, [onClose]);

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
    <Card className="fixed top-4 right-4 z-50 w-96 shadow-lg border-l-4 border-l-primary animate-in slide-in-from-right">
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
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
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

  useEffect(() => {
    if (!tableId) return;

    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/menu/${tableId}`);
        const data = await response.json();
        
        // Vérifier s'il y a de nouvelles commandes ou des mises à jour
        const currentOrders = data.orders || [];
        
        // Vérifier les changements de statut des commandes existantes
        currentOrders.forEach((order: any) => {
          // Trouver les commandes avec des changements de statut récents
          if (order.status === "ready" || order.status === "preparing") {
            const existingNotification = notifications.find(n => n.id === order.id);
            if (!existingNotification) {
              setNotifications(prev => [...prev, { ...order, timestamp: Date.now() }]);
            }
          }
        });
        
        if (currentOrders.length > lastOrderCount) {
          // Nouvelle commande confirmée
          const newOrder = currentOrders[currentOrders.length - 1];
          setNotifications(prev => [...prev, { ...newOrder, isNew: true, timestamp: Date.now() }]);
        }
        
        setLastOrderCount(currentOrders.length);
      } catch (error) {
        console.error("Erreur lors de la vérification des mises à jour:", error);
      }
    };

    const interval = setInterval(checkForUpdates, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(interval);
  }, [tableId, lastOrderCount]);

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return { notifications, removeNotification };
}