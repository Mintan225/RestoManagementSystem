import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OrderItemProps {
  order: {
    id: number;
    tableId: number;
    customerName?: string;
    customerPhone?: string;
    status: string;
    paymentMethod?: string;
    paymentStatus: string;
    total: string;
    notes?: string;
    createdAt: string;
  };
}

const statusConfig = {
  pending: { label: "En attente", color: "bg-warning" },
  preparing: { label: "Préparation", color: "bg-primary" },
  ready: { label: "Prêt", color: "bg-success" },
  completed: { label: "Terminé", color: "bg-gray-500" },
  cancelled: { label: "Annulé", color: "bg-destructive" },
};

const paymentStatusConfig = {
  pending: { label: "En attente", color: "bg-warning" },
  paid: { label: "Payé", color: "bg-success" },
  failed: { label: "Échec", color: "bg-destructive" },
};

export function OrderItem({ order }: OrderItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOrderMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Commande mise à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateOrderMutation.mutate({ status: newStatus });
  };

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
  const paymentInfo = paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig];

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">Commande #{order.id}</h3>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
            <Badge className={`${paymentInfo.color} text-white`}>
              {paymentInfo.label}
            </Badge>
          </div>
          <div className="text-right">
            <p className="font-semibold">€{parseFloat(order.total).toFixed(2)}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(order.createdAt), "HH:mm", { locale: fr })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Table:</strong> {order.tableId}
            </p>
            {order.customerName && (
              <p className="text-sm text-gray-600">
                <strong>Client:</strong> {order.customerName}
              </p>
            )}
            {order.customerPhone && (
              <p className="text-sm text-gray-600">
                <strong>Téléphone:</strong> {order.customerPhone}
              </p>
            )}
          </div>
          <div>
            {order.paymentMethod && (
              <p className="text-sm text-gray-600">
                <strong>Paiement:</strong> {order.paymentMethod}
              </p>
            )}
            {order.notes && (
              <p className="text-sm text-gray-600">
                <strong>Notes:</strong> {order.notes}
              </p>
            )}
          </div>
        </div>

        {order.status !== "completed" && order.status !== "cancelled" && (
          <div className="flex space-x-2">
            {order.status === "pending" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("preparing")}
                disabled={updateOrderMutation.isPending}
              >
                Commencer préparation
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("ready")}
                disabled={updateOrderMutation.isPending}
              >
                Marquer comme prêt
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("completed")}
                disabled={updateOrderMutation.isPending}
              >
                Terminer
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange("cancelled")}
              disabled={updateOrderMutation.isPending}
            >
              Annuler
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
