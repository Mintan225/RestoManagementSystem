import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/stats-cards";
import { OrderItem } from "@/components/order-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, ShoppingCart, QrCode, Receipt } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: todayStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/daily"],
  });

  const { data: activeOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders", { active: true }],
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["/api/tables"],
  });

  const stats = {
    todaySales: todayStats?.totalSales || 0,
    activeOrders: activeOrders.length || 0,
    occupiedTables: `${tables.filter((t: any) => t.status === 'occupied').length}/${tables.length}`,
    todayProfit: todayStats?.profit || 0,
  };

  // Mock weekly sales data for the chart
  const weeklyData = [
    { day: "Lun", sales: 2340, color: "bg-primary" },
    { day: "Mar", sales: 1980, color: "bg-primary" },
    { day: "Mer", sales: 2520, color: "bg-primary" },
    { day: "Jeu", sales: 1870, color: "bg-primary" },
    { day: "Ven", sales: 2680, color: "bg-primary" },
    { day: "Sam", sales: 3120, color: "bg-success" },
    { day: "Dim", sales: 1650, color: "bg-secondary" },
  ];

  const maxSales = Math.max(...weeklyData.map(d => d.sales));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && <StatsCards stats={stats} />}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col" asChild>
            <Link href="/orders">
              <Plus className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium">Nouvelle commande</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20 flex-col" asChild>
            <Link href="/products">
              <Package className="h-6 w-6 text-success mb-2" />
              <span className="text-sm font-medium">Ajouter produit</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20 flex-col" asChild>
            <Link href="/qr-codes">
              <QrCode className="h-6 w-6 text-warning mb-2" />
              <span className="text-sm font-medium">Générer QR</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20 flex-col" asChild>
            <Link href="/expenses">
              <Receipt className="h-6 w-6 text-destructive mb-2" />
              <span className="text-sm font-medium">Ajouter dépense</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Orders & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : activeOrders.length > 0 ? (
              <div className="space-y-4">
                {activeOrders.slice(0, 3).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-2 h-2 bg-success rounded-full"></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Commande #{order.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Table {order.tableId} - {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        €{parseFloat(order.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">{order.status}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-3">
                  <Button variant="link" className="p-0 text-primary" asChild>
                    <Link href="/orders">
                      Voir toutes les commandes →
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucune commande active
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sales Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Ventes de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((data, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-12 text-sm text-gray-500">{data.day}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mx-2">
                    <div
                      className={`${data.color} h-4 rounded-full transition-all duration-300`}
                      style={{ width: `${(data.sales / maxSales) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-sm text-gray-900 text-right">
                    €{data.sales.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
