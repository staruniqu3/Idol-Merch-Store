import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  getListProductsQueryKey,
  useCreateOrder,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { ShoppingCart, Plus, Minus, X, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  orderType: string;
};

const CATEGORIES = ["Tất cả", "photocard", "album", "lightstick", "goods"];

const categoryLabels: Record<string, string> = {
  photocard: "Photocard",
  album: "Album",
  lightstick: "Lightstick",
  goods: "Goods",
};

const orderTypeLabel: Record<string, string> = {
  preorder: "Pre-order",
  pickup: "Pickup",
};

const orderTypeBadgeClass: Record<string, string> = {
  preorder: "bg-purple-100 text-purple-700 border-purple-200",
  pickup: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export default function ShopPage() {
  const { data: products, isLoading } = useListProducts();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = products?.filter((p) =>
    selectedCategory === "Tất cả" ? true : p.category === selectedCategory
  ) ?? [];

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (product: typeof filtered[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, orderType: product.orderType }];
    });
    toast({ title: "Da them vao gio hang", description: product.name });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const changeQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  };

  const handleCheckout = () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Vui long nhap ten va so dien thoai", variant: "destructive" });
      return;
    }
    const orderType = cart.some((i) => i.orderType === "preorder") ? "preorder" : "pickup";
    createOrder.mutate(
      {
        data: {
          memberName: name,
          memberPhone: phone,
          items: JSON.stringify(cart.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity }))),
          totalAmount: cartTotal,
          orderType,
          notes: notes || null,
          memberId: null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          setCart([]);
          setName("");
          setPhone("");
          setNotes("");
          setCartOpen(false);
          setCheckoutOpen(false);
          toast({ title: "Dat hang thanh cong!", description: "Shop se lien he ban sớm." });
        },
        onError: () => {
          toast({ title: "Co loi xay ra", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Idol Merch Shop</h1>
          <p className="text-xs text-muted-foreground">Hang chinh hang, uy tin</p>
        </div>
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative" data-testid="button-cart">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm flex flex-col">
            <SheetHeader>
              <SheetTitle>Gio hang ({cartCount})</SheetTitle>
            </SheetHeader>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <ShoppingBag size={48} strokeWidth={1.2} />
                <p className="text-sm">Gio hang trong</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 mt-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex gap-3 p-3 bg-muted rounded-xl" data-testid={`cart-item-${item.productId}`}>
                      <div className="flex-1">
                        <p className="text-sm font-semibold leading-snug">{item.name}</p>
                        <p className="text-xs text-primary font-bold mt-0.5">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQty(item.productId, -1)} data-testid={`button-minus-${item.productId}`}>
                          <Minus size={12} />
                        </Button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQty(item.productId, 1)} data-testid={`button-plus-${item.productId}`}>
                          <Plus size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.productId)} data-testid={`button-remove-${item.productId}`}>
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-muted-foreground">Tong cong</span>
                    <span className="text-xl font-bold text-primary">{formatPrice(cartTotal)}</span>
                  </div>
                  {!checkoutOpen ? (
                    <Button className="w-full" onClick={() => setCheckoutOpen(true)} data-testid="button-checkout">
                      Dat hang ngay
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="name">Ho ten *</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" data-testid="input-name" />
                      </div>
                      <div>
                        <Label htmlFor="phone">So dien thoai *</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" data-testid="input-phone" />
                      </div>
                      <div>
                        <Label htmlFor="notes">Ghi chu</Label>
                        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chu them..." rows={2} data-testid="input-notes" />
                      </div>
                      <Button className="w-full" onClick={handleCheckout} disabled={createOrder.isPending} data-testid="button-place-order">
                        {createOrder.isPending ? "Dang dat..." : "Xac nhan dat hang"}
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setCheckoutOpen(false)}>
                        Quay lai gio hang
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
            data-testid={`filter-${cat}`}
          >
            {cat === "Tất cả" ? cat : (categoryLabels[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
              <Skeleton className="w-full aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}

        {!isLoading && filtered.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Package size={48} strokeWidth={1.2} />
            <p className="text-sm">Chua co san pham nao</p>
          </div>
        )}

        {filtered.map((product) => (
          <div key={product.id} className="bg-card rounded-2xl overflow-hidden border border-border flex flex-col shadow-sm" data-testid={`card-product-${product.id}`}>
            <div className="aspect-square bg-muted flex items-center justify-center relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={48} strokeWidth={1} className="text-muted-foreground/40" />
              )}
              <Badge className={`absolute top-2 left-2 text-[10px] border ${orderTypeBadgeClass[product.orderType] ?? ""}`} variant="outline">
                {orderTypeLabel[product.orderType] ?? product.orderType}
              </Badge>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              <p className="text-sm font-bold leading-snug line-clamp-2">{product.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-bold text-base">{formatPrice(product.price)}</span>
                <span className="text-xs text-muted-foreground">Con {product.stock}</span>
              </div>
              <Button
                size="sm"
                className="w-full mt-auto"
                disabled={!product.isAvailable || product.stock === 0}
                onClick={() => addToCart(product)}
                data-testid={`button-add-cart-${product.id}`}
              >
                {product.isAvailable && product.stock > 0 ? "Them vao gio" : "Het hang"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
