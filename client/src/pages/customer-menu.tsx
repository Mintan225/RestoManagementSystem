import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Plus,
  Minus,
  UtensilsCrossed,
  Phone,
  User,
  CreditCard,
  Smartphone,
  CheckCircle,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export default function CustomerMenu() {
  const [, params] = useRoute("/menu/:tableNumber");
  const tableNumber = params?.tableNumber;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money">("cash");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: menuData, isLoading } = useQuery({
    queryKey: [`/api/menu/${tableNumber}`],
    enabled: !!tableNumber,
  });

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create order");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commande envoyée!",
        description: "Votre commande a été transmise en cuisine. Merci!",
      });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setOrderNotes("");
      setShowCart(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!tableNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Numéro de table manquant
            </h1>
            <p className="text-gray-600">
              Veuillez scanner le QR code de votre table.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <UtensilsCrossed className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Table non trouvée
            </h1>
            <p className="text-gray-600">
              Cette table n'existe pas ou n'est pas disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { table, categories, products } = menuData;

  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            quantity: 1,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const updateCartItemNotes = (productId: number, notes: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, notes } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItemQuantity = (productId: number) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const filteredProducts = selectedCategory
    ? products.filter((product: any) => product.categoryId === selectedCategory)
    : products;

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des articles à votre panier avant de commander.",
        variant: "destructive",
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir votre nom.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      orderData: {
        tableId: table.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        status: "pending",
        paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
        total: getTotalPrice(),
        notes: orderNotes.trim() || null,
      },
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
      })),
    };

    orderMutation.mutate(orderData);
  };

  if (showCart) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowCart(false)}
              >
                ← Retour au menu
              </Button>
              <div className="text-center">
                <h1 className="text-lg font-bold">Votre commande</h1>
                <p className="text-sm text-gray-600">Table {table.number}</p>
              </div>
              <div className="w-20"></div>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-6">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articles commandés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                    <div className="mt-2">
                      <Input
                        placeholder="Notes spéciales (optionnel)"
                        value={item.notes || ""}
                        onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  <User className="h-4 w-4 inline mr-2" />
                  Nom *
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Votre nom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Téléphone (optionnel)
                </Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Votre numéro de téléphone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderNotes">Notes pour la commande</Label>
                <Textarea
                  id="orderNotes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Instructions spéciales, allergies, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Méthode de paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                  className="h-16 flex-col"
                >
                  <CreditCard className="h-6 w-6 mb-1" />
                  <span>Espèces</span>
                </Button>
                <Button
                  variant={paymentMethod === "mobile_money" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("mobile_money")}
                  className="h-16 flex-col"
                >
                  <Smartphone className="h-6 w-6 mb-1" />
                  <span>Mobile Money</span>
                </Button>
              </div>
              {paymentMethod === "cash" && (
                <p className="text-sm text-gray-600 mt-2">
                  Vous paierez à la livraison de votre commande.
                </p>
              )}
              {paymentMethod === "mobile_money" && (
                <p className="text-sm text-gray-600 mt-2">
                  Le paiement sera traité immédiatement via Mobile Money.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Order */}
          <Button
            onClick={handleSubmitOrder}
            disabled={orderMutation.isPending || cart.length === 0}
            className="w-full h-12 text-lg"
          >
            {orderMutation.isPending ? (
              "Envoi en cours..."
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirmer la commande ({formatCurrency(getTotalPrice())})
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <UtensilsCrossed className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Notre Menu</h1>
                <p className="text-sm text-gray-600">Table {table.number}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCart(true)}
              className="relative"
              disabled={cart.length === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Panier
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-white text-xs">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap"
              >
                Tout voir
              </Button>
              {categories.map((category: any) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product: any) => (
            <Card key={product.id} className="overflow-hidden">
              {product.imageUrl && (
                <div className="h-48 bg-gray-100">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                {product.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCartItemQuantity(product.id) > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(product.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">
                          {getCartItemQuantity(product.id)}
                        </span>
                      </>
                    )}
                    <Button
                      size="sm"
                      onClick={() => addToCart(product)}
                    >
                      <Plus className="h-4 w-4" />
                      {getCartItemQuantity(product.id) === 0 ? "Ajouter" : ""}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun produit disponible
            </h3>
            <p className="text-gray-500">
              {selectedCategory 
                ? "Aucun produit dans cette catégorie."
                : "Le menu n'est pas encore disponible."}
            </p>
          </div>
        )}
      </div>

      {/* Fixed Cart Button for Mobile */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <Button
            onClick={() => setShowCart(true)}
            className="relative h-12 w-12 rounded-full shadow-lg"
          >
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-white text-xs">
              {getTotalItems()}
            </Badge>
          </Button>
        </div>
      )}
    </div>
  );
}
