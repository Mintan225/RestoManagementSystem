import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Euro, Calendar, Download, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const saleFormSchema = z.object({
  amount: z.string().min(1, "Le montant est requis"),
  paymentMethod: z.string().min(1, "La méthode de paiement est requise"),
  description: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

function SaleForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/sales", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Succès",
        description: "Vente ajoutée avec succès",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la vente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SaleFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une vente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une vente</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...form.register("amount")}
              placeholder="0.00"
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="paymentMethod">Méthode de paiement</Label>
            <Select onValueChange={(value) => form.setValue("paymentMethod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.paymentMethod && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.paymentMethod.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              {...form.register("description")}
              placeholder="Description de la vente..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Sales() {
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return {
          start: startOfDay(now).toISOString(),
          end: endOfDay(now).toISOString(),
        };
      case "week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
          end: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        };
      case "month":
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
      case "custom":
        return {
          start: startDate ? new Date(startDate).toISOString() : "",
          end: endDate ? new Date(endDate).toISOString() : "",
        };
      default:
        return { start: "", end: "" };
    }
  };

  const { start, end } = getDateRange();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/sales", { startDate: start, endDate: end }],
    enabled: !!start && !!end,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["/api/analytics/daily"],
  });

  // Calculate totals
  const totalSales = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);
  const cashSales = sales
    .filter((sale: any) => sale.paymentMethod === "cash")
    .reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);
  const mobileMoneySales = sales
    .filter((sale: any) => sale.paymentMethod === "mobile_money")
    .reduce((sum: number, sale: any) => sum + parseFloat(sale.amount), 0);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces";
      case "mobile_money":
        return "Mobile Money";
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "cash":
        return "bg-success";
      case "mobile_money":
        return "bg-primary";
      default:
        return "bg-gray-500";
    }
  };

  const exportToCSV = () => {
    if (sales.length === 0) return;

    const headers = ["Date", "Montant", "Méthode de paiement", "Description"];
    const csvContent = [
      headers.join(","),
      ...sales.map((sale: any) => [
        format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }),
        parseFloat(sale.amount).toFixed(2),
        getPaymentMethodLabel(sale.paymentMethod),
        sale.description || "",
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ventes-${dateRange}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des Ventes</h1>
        <div className="flex gap-2">
          <SaleForm />
          <Button onClick={exportToCSV} disabled={sales.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Période d'analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Période</Label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="custom">Période personnalisée</option>
              </select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Euro className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total des ventes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success rounded-md flex items-center justify-center">
                  <Euro className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Espèces</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(cashSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Euro className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mobile Money</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(mobileMoneySales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nombre de ventes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sales.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des ventes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : sales.length > 0 ? (
            <div className="space-y-4">
              {sales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(parseFloat(sale.amount))}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <Badge className={`${getPaymentMethodColor(sale.paymentMethod)} text-white`}>
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </Badge>
                    </div>
                    {sale.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {sale.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune vente trouvée
              </h3>
              <p className="text-gray-500">
                Aucune vente n'a été enregistrée pour cette période.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
