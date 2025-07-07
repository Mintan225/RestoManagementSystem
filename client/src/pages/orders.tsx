import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderItem } from "@/components/order-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart } from "lucide-react";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: activeOrders = [] } = useQuery({
    queryKey: ["/api/orders", { active: true }],
  });

  const filteredOrders = allOrders.filter((order: any) => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm) ||
      order.tableId.toString().includes(searchTerm);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && order.status !== "completed" && order.status !== "cancelled";
    if (activeTab === "completed") return matchesSearch && order.status === "completed";
    if (activeTab === "cancelled") return matchesSearch && order.status === "cancelled";
    
    return matchesSearch && order.status === activeTab;
  });

  const getOrderCounts = () => {
    const counts = {
      all: allOrders.length,
      pending: allOrders.filter((o: any) => o.status === "pending").length,
      preparing: allOrders.filter((o: any) => o.status === "preparing").length,
      ready: allOrders.filter((o: any) => o.status === "ready").length,
      completed: allOrders.filter((o: any) => o.status === "completed").length,
      cancelled: allOrders.filter((o: any) => o.status === "cancelled").length,
    };
    return counts;
  };

  const counts = getOrderCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {activeOrders.length} commandes actives
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par numéro, client, téléphone ou table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            Toutes ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Préparation ({counts.preparing})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Prêtes ({counts.ready})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées ({counts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulées ({counts.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <OrderItem key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune commande trouvée
                </h3>
                <p className="text-gray-500 text-center">
                  {searchTerm
                    ? "Aucune commande ne correspond à votre recherche."
                    : activeTab === "all"
                    ? "Aucune commande n'a encore été passée."
                    : `Aucune commande dans l'état "${activeTab}".`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
