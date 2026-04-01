import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  getListProductsQueryKey,
  useCreateOrder,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { ShoppingCart, Plus, Minus, X, Package, ShoppingBag, Sparkles } from "lucide-react";
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
  preorder: "bg-primary/15 text-primary border-primary/20",
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
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, orderType: product.orderType }];
    });
    toast({ title: "Đã thêm vào giỏ hàng", description: product.name });
  };

  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const changeQty = (productId: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const handleCheckout = () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Vui lòng nhập tên và số điện thoại", variant: "destructive" });
      return;
    }
    const orderType = cart.some((i) => i.orderType === "preorder") ? "preorder" : "pickup";
    createOrder.mutate(
      { data: { memberName: name, memberPhone: phone, items: JSON.stringify(cart.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity }))), totalAmount: cartTotal, orderType, notes: notes || null, memberId: null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          setCart([]); setName(""); setPhone(""); setNotes(""); setCartOpen(false); setCheckoutOpen(false);
          toast({ title: "Đặt hàng thành công!", description: "Shop sẽ liên hệ bạn sớm nhé 🎉" });
        },
        onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-8 pb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/30 shadow-lg">
                <img
                  src="/logo-tiem-chu-du.jpg"
                  alt="Tiệm Chu Du"
                  className="w-full h-full object-cover"
                  style={{ mixBlendMode: "screen", transform: "scale(1.1)" }}
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-white/40 flex items-center justify-center">
                <Sparkles size={8} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight tracking-tight">
                Tiệm Chu Du
              </h1>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.15em]">Order & Pickup tất tần tật</p>
            </div>
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button className="relative w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors" data-testid="button-cart">
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm flex flex-col">
              <SheetHeader>
                <SheetTitle>Giỏ hàng ({cartCount})</SheetTitle>
              </SheetHeader>
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <ShoppingBag size={48} strokeWidth={1.2} className="text-primary/30" />
                  <p className="font-semibold">Giỏ hàng trống</p>
                  <p className="text-sm">Thêm sản phẩm để đặt hàng</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-3 mt-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex gap-3 p-3 bg-muted rounded-2xl" data-testid={`cart-item-${item.productId}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold leading-snug line-clamp-2">{item.name}</p>
                          <p className="text-xs text-primary font-black mt-0.5">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => changeQty(item.productId, -1)} data-testid={`button-minus-${item.productId}`}><Minus size={11} /></Button>
                          <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => changeQty(item.productId, 1)} data-testid={`button-plus-${item.productId}`}><Plus size={11} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={() => removeFromCart(item.productId)} data-testid={`button-remove-${item.productId}`}><X size={11} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-muted-foreground">Tổng cộng</span>
                      <span className="text-xl font-black text-primary">{formatPrice(cartTotal)}</span>
                    </div>
                    {!checkoutOpen ? (
                      <Button className="w-full rounded-xl font-bold" onClick={() => setCheckoutOpen(true)} data-testid="button-checkout">
                        Đặt hàng ngay
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div><Label htmlFor="name">Họ tên *</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" className="rounded-xl mt-1" data-testid="input-name" /></div>
                        <div><Label htmlFor="phone">Số điện thoại *</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" className="rounded-xl mt-1" data-testid="input-phone" /></div>
                        <div><Label htmlFor="notes">Ghi chú</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú thêm..." rows={2} className="rounded-xl mt-1" data-testid="input-notes" /></div>
                        <Button className="w-full rounded-xl font-bold" onClick={handleCheckout} disabled={createOrder.isPending} data-testid="button-place-order">
                          {createOrder.isPending ? "Đang đặt..." : "Xác nhận đặt hàng"}
                        </Button>
                        <Button variant="ghost" className="w-full rounded-xl" onClick={() => setCheckoutOpen(false)}>
                          Quay lại giỏ hàng
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-white text-foreground shadow-sm"
                  : "bg-white/15 text-white/80 hover:bg-white/25"
              }`}
              data-testid={`filter-${cat}`}
            >
              {cat === "Tất cả" ? cat : (categoryLabels[cat] ?? cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
              <Skeleton className="w-full aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            </div>
          ))}

        {!isLoading && filtered.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Package size={36} strokeWidth={1.2} />
            </div>
            <p className="font-bold text-foreground">Chưa có sản phẩm</p>
          </div>
        )}

        {filtered.filter((p) => p.isAvailable).map((product) => (
          <div
            key={product.id}
            className="bg-card rounded-2xl overflow-hidden border border-border flex flex-col shadow-sm card-hover"
            data-testid={`card-product-${product.id}`}
          >
            <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={48} strokeWidth={0.8} className="text-muted-foreground/30" />
              )}
              <Badge className={`absolute top-2 left-2 text-[10px] border font-bold ${orderTypeBadgeClass[product.orderType] ?? ""}`} variant="outline">
                {orderTypeLabel[product.orderType] ?? product.orderType}
              </Badge>
              {product.stock <= 5 && product.stock > 0 && (
                <Badge className="absolute top-2 right-2 text-[10px] bg-red-100 text-red-600 border-red-200 font-bold" variant="outline">
                  Gần hết
                </Badge>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              <p className="text-sm font-bold leading-snug line-clamp-2">{product.name}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-primary font-black text-base">{formatPrice(product.price)}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Còn {product.stock}</span>
              </div>
              <Button
                size="sm"
                className="w-full rounded-xl font-bold"
                disabled={!product.isAvailable || product.stock === 0}
                onClick={() => addToCart(product)}
                data-testid={`button-add-cart-${product.id}`}
              >
                {product.isAvailable && product.stock > 0 ? "Thêm vào giỏ" : "Hết hàng"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
