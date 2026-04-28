import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  getListProductsQueryKey,
  useCreateOrder,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { ShoppingCart, Plus, Minus, X, Package, ShoppingBag, Sparkles, ExternalLink, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  orderType: string;
  imageUrl?: string | null;
  variant?: string;
  subVariant?: string;
};

const cartKey = (productId: number, variant?: string, subVariant?: string) => `${productId}::${variant ?? ""}::${subVariant ?? ""}`;

const PRESET_CATEGORIES = ["Kpop", "GMMTV", "US UK", "Tạp Hoá"];

const orderTypeLabel: Record<string, string> = {
  preorder: "Pre-order",
  pickup: "Pickup",
  instock: "Hàng sẵn",
  slot: "Đặt Slot",
  prestock: "Hàng đặt trước",
  awaitingstock: "Awaiting Stock",
};

const orderTypeBadgeClass: Record<string, string> = {
  preorder: "bg-primary/15 text-primary border-primary/20",
  pickup: "bg-emerald-100 text-emerald-700 border-emerald-200",
  instock: "bg-amber-100 text-amber-700 border-amber-200",
  prestock: "bg-violet-100 text-violet-700 border-violet-200",
  awaitingstock: "bg-sky-100 text-sky-700 border-sky-200",
  slot: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

const MATMAT_URL = "https://matmat.up.railway.app/";

export default function ShopPage() {
  const { data: products, isLoading } = useListProducts();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout" | "payment">("cart");
  const [phone, setPhone] = useState("");
  const [slotResults, setSlotResults] = useState<string[]>([]);
  const [isSlotLoading, setIsSlotLoading] = useState(false);
  const createOrder = useCreateOrder();

  const isSlotCart = cart.length > 0 && cart.every((i) => i.orderType === "slot");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const categories = ["Tất cả", ...PRESET_CATEGORIES, ...(products ?? [])
    .map((p) => p.category)
    .filter((c, i, arr) => !PRESET_CATEGORIES.includes(c) && arr.indexOf(c) === i)
  ];

  const filtered = products?.filter((p) =>
    selectedCategory === "Tất cả" ? true : p.category === selectedCategory
  ) ?? [];

  const [variantPickerProduct, setVariantPickerProduct] = useState<typeof filtered[0] | null>(null);
  const [pickedVariant, setPickedVariant] = useState<{ name: string; price?: number; stock?: number; soldOut?: boolean; subVariants?: Array<{ name: string; price?: number; stock?: number; soldOut?: boolean }> } | null>(null);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const doAddToCart = (product: typeof filtered[0], variantName?: string, variantPrice?: number, subVariantName?: string) => {
    const key = cartKey(product.id, variantName, subVariantName);
    const finalPrice = variantPrice ?? product.price;
    setCart((prev) => {
      const existing = prev.find((i) => cartKey(i.productId, i.variant, i.subVariant) === key);
      if (existing) return prev.map((i) => cartKey(i.productId, i.variant, i.subVariant) === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: finalPrice, quantity: 1, orderType: product.orderType, imageUrl: product.imageUrl, variant: variantName, subVariant: subVariantName }];
    });
    const label = [variantName, subVariantName].filter(Boolean).join(" · ");
    toast({ title: "Đã thêm vào giỏ hàng", description: label ? `${product.name} (${label})` : product.name });
  };

  const addToCart = (product: typeof filtered[0]) => {
    if (product.variants && product.variants.length > 0) {
      setVariantPickerProduct(product);
    } else {
      doAddToCart(product);
    }
  };

  const removeFromCart = (productId: number, variant?: string, subVariant?: string) => {
    const key = cartKey(productId, variant, subVariant);
    setCart((prev) => prev.filter((i) => cartKey(i.productId, i.variant, i.subVariant) !== key));
  };

  const getSlotCapacityPerSlot = (productId: number, variant?: string, subVariant?: string): number | null => {
    const product = (products ?? []).find((p) => p.id === productId);
    if (!product || (product as any).orderType !== "slot") return null;
    const cfg = (product as any).slotConfig as Record<string, any> | null;
    if (!cfg) return null;
    const key = variant && subVariant ? `${variant}::${subVariant}` : variant ?? "";
    const entry = cfg[key];
    if (!entry || typeof entry !== "object") return null;
    const cap = Number(entry.capacityPerSlot ?? 0);
    return cap > 0 ? cap : null;
  };

  const changeQty = (productId: number, delta: number, variant?: string, subVariant?: string) => {
    const key = cartKey(productId, variant, subVariant);
    const cap = getSlotCapacityPerSlot(productId, variant, subVariant);
    setCart((prev) => prev.map((i) => {
      if (cartKey(i.productId, i.variant, i.subVariant) !== key) return i;
      const next = Math.max(1, i.quantity + delta);
      return { ...i, quantity: cap != null ? Math.min(next, cap) : next };
    }));
  };

  const setQty = (productId: number, qty: number, variant?: string, subVariant?: string) => {
    const key = cartKey(productId, variant, subVariant);
    const cap = getSlotCapacityPerSlot(productId, variant, subVariant);
    const capped = cap != null ? Math.min(qty, cap) : qty;
    setCart((prev) => prev.map((i) => cartKey(i.productId, i.variant, i.subVariant) === key ? { ...i, quantity: Math.max(1, isNaN(capped) ? 1 : capped) } : i));
  };

  const autoAddPoints = async (memberPhone: string, totalAmount: number) => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const pts = Math.floor(totalAmount / 10000);
    if (pts <= 0) return;
    try {
      const res = await fetch(`${base}/api/members/lookup?phone=${encodeURIComponent(memberPhone)}&_t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const member = await res.json();
      if (!member?.id) return;
      await fetch(`${base}/api/members/${member.id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: pts, reason: "Đặt hàng thành công" }),
      });
    } catch {}
  };

  const handleCheckout = () => {
    if (!phone.trim()) {
      toast({ title: "Vui lòng nhập số điện thoại", variant: "destructive" });
      return;
    }
    const orderType = cart.some((i) => i.orderType === "preorder") ? "preorder" : "pickup";
    createOrder.mutate(
      {
        data: {
          memberName: phone,
          memberPhone: phone,
          items: JSON.stringify(cart.map((i) => { const label = [i.variant, i.subVariant].filter(Boolean).join(" · "); return { productId: i.productId, name: label ? `${i.name} (${label})` : i.name, price: i.price, quantity: i.quantity }; })),
          totalAmount: cartTotal,
          orderType,
          notes: null,
          memberId: null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          autoAddPoints(phone.trim(), cartTotal);
          setStep("payment");
        },
        onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
      }
    );
  };

  const handleSlotBooking = async () => {
    if (!phone.trim()) { toast({ title: "Vui lòng nhập số điện thoại", variant: "destructive" }); return; }
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    setIsSlotLoading(true);
    try {
      const codes: string[] = [];
      for (const item of cart) {
        const res = await fetch(`${base}/api/slot-bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.productId, variant: item.variant ?? null, subVariant: item.subVariant ?? null, phone: phone.trim() }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Có lỗi xảy ra");
        }
        const data = await res.json();
        codes.push(data.queueCode);
      }
      setSlotResults(codes);
      setCart([]);
      setStep("payment");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Có lỗi xảy ra", variant: "destructive" });
    } finally {
      setIsSlotLoading(false);
    }
  };

  const handleClose = () => {
    setCartOpen(false);
    setStep("cart");
    setPhone("");
    setCart([]);
    setSlotResults([]);
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
              <h1 className="text-xl font-black leading-tight tracking-tight">Tiệm Chu Du</h1>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.15em]">Order & Pickup tất tần tật</p>
            </div>
          </div>

          <Sheet open={cartOpen} onOpenChange={(v) => { setCartOpen(v); if (!v) { setStep("cart"); setPhone(""); } }}>
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

            <SheetContent side="right" className="w-full max-w-sm flex flex-col p-0">
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
                <SheetTitle>
                  {step === "payment" ? "Thanh toán" : isSlotCart ? `🎫 Đặt Slot (${cartCount})` : `Giỏ hàng (${cartCount})`}
                </SheetTitle>
              </SheetHeader>

              {/* ── STEP: PAYMENT SUCCESS ── */}
              {step === "payment" && slotResults.length > 0 && (
                <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-fuchsia-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-fuchsia-500" />
                  </div>
                  <div className="w-full">
                    <p className="text-lg font-black">Đặt slot thành công! 🎫</p>
                    <p className="text-sm text-muted-foreground mt-1">Số thứ tự của bạn:</p>
                    <div className="mt-3 space-y-2">
                      {slotResults.map((code) => (
                        <div key={code} className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl px-4 py-3">
                          <p className="text-lg font-black font-mono text-fuchsia-700 tracking-widest">{code}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 mt-4 leading-relaxed">
                      📢 Khi có giá sản phẩm trên Facebook vui lòng thanh toán trong vòng <strong>24h</strong> để giữ số thứ tự slot.
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full rounded-xl" onClick={handleClose}>
                    Đóng
                  </Button>
                </div>
              )}

              {step === "payment" && slotResults.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-black">Đặt hàng thành công! 🎉</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Shop đã nhận đơn của bạn.<br />Vui lòng chuyển khoản và điền form xác nhận.
                    </p>
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                      ⚠️ Nếu bạn không chuyển khoản và điền form, đơn hàng sẽ không được đặt thành công.
                    </p>
                  </div>

                  <a
                    href={MATMAT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <div className="w-full bg-gradient-to-br from-primary to-pink-400 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <CreditCard size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-base leading-tight">Chuyển khoản & Điền form</p>
                          <p className="text-[11px] opacity-75 font-medium">Mát Mát Payment</p>
                        </div>
                        <ExternalLink size={16} className="ml-auto opacity-70" />
                      </div>
                      <div className="bg-white/15 rounded-xl px-3 py-2 text-sm font-bold">
                        {formatPrice(cartTotal)}
                      </div>
                    </div>
                  </a>

                  <Button variant="ghost" className="w-full rounded-xl" onClick={handleClose}>
                    Đóng
                  </Button>
                </div>
              )}

              {/* ── STEP: CART ── */}
              {step === "cart" && (
                <>
                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 px-5">
                      <ShoppingBag size={48} strokeWidth={1.2} className="text-primary/30" />
                      <p className="font-semibold">Giỏ hàng trống</p>
                      <p className="text-sm">Thêm sản phẩm để đặt hàng</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto space-y-2 px-5 py-4">
                        {cart.map((item) => (
                          <div key={cartKey(item.productId, item.variant, item.subVariant)} className="flex gap-3 p-2.5 bg-muted/60 rounded-2xl" data-testid={`cart-item-${item.productId}`}>
                            {/* thumbnail */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={20} className="text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold leading-snug line-clamp-2">{item.name}</p>
                              {(item.variant || item.subVariant) && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {item.variant && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">{item.variant}</span>}
                                  {item.subVariant && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">{item.subVariant}</span>}
                                </div>
                              )}
                              <p className="text-xs text-primary font-black mt-0.5">{formatPrice(item.price)}</p>
                              <div className="flex items-center gap-1 mt-1.5">
                                {(() => {
                                  const cap = getSlotCapacityPerSlot(item.productId, item.variant, item.subVariant);
                                  return (<>
                                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => changeQty(item.productId, -1, item.variant, item.subVariant)} data-testid={`button-minus-${item.productId}`}><Minus size={10} /></Button>
                                    <input
                                      type="number"
                                      min={1}
                                      max={cap ?? undefined}
                                      value={item.quantity}
                                      onChange={(e) => setQty(item.productId, parseInt(e.target.value), item.variant, item.subVariant)}
                                      onBlur={(e) => { const v = parseInt(e.target.value); if (isNaN(v) || v < 1) setQty(item.productId, 1, item.variant, item.subVariant); }}
                                      className="w-10 text-center text-sm font-black bg-transparent border border-border rounded-lg h-6 outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                      data-testid={`input-qty-${item.productId}`}
                                    />
                                    {cap != null && <span className="text-[10px] text-fuchsia-600 font-semibold shrink-0">/{cap}</span>}
                                  </>);
                                })()}
                                <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => changeQty(item.productId, 1, item.variant, item.subVariant)} data-testid={`button-plus-${item.productId}`}><Plus size={10} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-destructive ml-1" onClick={() => removeFromCart(item.productId, item.variant, item.subVariant)} data-testid={`button-remove-${item.productId}`}><X size={10} /></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border px-5 pt-3 pb-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-muted-foreground">Tổng cộng</span>
                          <span className="text-xl font-black text-primary">{formatPrice(cartTotal)}</span>
                        </div>
                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
                          ⚠️ Giá sản phẩm <strong>chưa bao gồm</strong> tiền cân và phí ship nội địa.
                        </p>
                        <Button className={`w-full rounded-xl font-bold ${isSlotCart ? "bg-fuchsia-600 hover:bg-fuchsia-700" : ""}`} onClick={() => setStep("checkout")} data-testid="button-checkout">
                          {isSlotCart ? "🎫 Đặt slot" : "Đặt hàng ngay"}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── STEP: CHECKOUT ── */}
              {step === "checkout" && (
                <div className="flex-1 flex flex-col px-5 py-4">
                  {/* order summary mini */}
                  <div className="bg-muted/50 rounded-2xl p-3 mb-4 space-y-1.5">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                        <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-1.5 flex justify-between font-black">
                      <span>Tổng</span>
                      <span className="text-primary">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div>
                      <Label htmlFor="phone" className="font-bold">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09xxxxxxxx"
                        className="rounded-xl mt-1 text-base"
                        inputMode="tel"
                        data-testid="input-phone"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1.5">Shop dùng để nhập đơn vào hệ thống.</p>
                    </div>

                  </div>

                  <div className="space-y-2 mt-4">
                    <Button
                      className={`w-full rounded-xl font-bold ${isSlotCart ? "bg-fuchsia-600 hover:bg-fuchsia-700" : ""}`}
                      onClick={isSlotCart ? handleSlotBooking : handleCheckout}
                      disabled={isSlotCart ? isSlotLoading : createOrder.isPending}
                      data-testid="button-place-order"
                    >
                      {isSlotCart
                        ? (isSlotLoading ? "Đang đặt slot..." : "🎫 Xác nhận đặt slot")
                        : (createOrder.isPending ? "Đang xử lý..." : "Xác nhận đặt hàng")}
                    </Button>
                    <Button variant="ghost" className="w-full rounded-xl" onClick={() => setStep("cart")}>
                      Quay lại giỏ hàng
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((cat) => (
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
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2 pb-24">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}

        {!isLoading && filtered.filter((p) => p.isAvailable).length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Package size={36} strokeWidth={1.2} />
            </div>
            <p className="font-bold text-foreground">Chưa có sản phẩm</p>
          </div>
        )}

        {filtered.filter((p) => p.isAvailable).map((product) => {
          const _variants = (product.variants ?? []) as Array<{ soldOut?: boolean }>;
          const cardSoldOut = _variants.length > 0 ? _variants.every((v) => v.soldOut) : !!(product as any).isSoldOut;
          return (
          <div
            key={product.id}
            className={`bg-card rounded-2xl border border-border px-4 py-3 flex items-start gap-3 shadow-sm${cardSoldOut ? " opacity-60 grayscale pointer-events-none" : ""}`}
            data-testid={`card-product-${product.id}`}
          >
            <div className="flex-1 min-w-0">
              {/* Row 1: badges */}
              {(() => {
                const variantPrices = (product.variants ?? []).map((v) => (v as any).price).filter((p) => p != null) as number[];
                const hasRange = variantPrices.length >= 2;
                const minP = hasRange ? Math.min(...variantPrices) : null;
                const maxP = hasRange ? Math.max(...variantPrices) : null;
                const singleVariantPrice = variantPrices.length === 1 ? variantPrices[0] : null;
                const label = (product as any).orderLabel as string | null;
                const oName = (product as any).orderName as string | null;
                return (
                  <>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <Badge className={`text-[10px] border font-bold px-2 py-0 shrink-0 ${orderTypeBadgeClass[product.orderType] ?? ""}`} variant="outline">
                        {label ?? (orderTypeLabel[product.orderType] ?? product.orderType)}
                      </Badge>
                      {label && (
                        <Badge className="text-[10px] border-border text-muted-foreground font-semibold px-2 py-0 shrink-0" variant="outline">
                          {orderTypeLabel[product.orderType] ?? product.orderType}
                        </Badge>
                      )}
                      {product.orderType !== "preorder" && product.stock <= 5 && product.stock > 0 && (
                        <Badge className="text-[10px] bg-red-100 text-red-600 border-red-200 font-bold px-2 py-0 shrink-0" variant="outline">
                          Gần hết
                        </Badge>
                      )}
                      {(() => {
                        const variants = (product.variants ?? []) as Array<{ soldOut?: boolean }>;
                        const allSoldOut = variants.length > 0 ? variants.every((v) => v.soldOut) : (product as any).isSoldOut;
                        return allSoldOut ? (
                          <Badge className="text-[10px] bg-red-500 text-white border-red-600 font-black px-2 py-0 shrink-0 tracking-wide" variant="outline">
                            Not available
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    {/* Row 2: name */}
                    <p className="text-sm font-bold leading-snug text-foreground">{product.name}</p>
                    {oName && <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">{oName}</p>}
                    {/* Row 3: price + stock */}
                    <div className="flex items-center gap-2 mt-1">
                      {hasRange ? (
                        <span className="text-primary font-black text-base">
                          {formatPrice(minP!)} – {formatPrice(maxP!)}
                        </span>
                      ) : (
                        <span className="text-primary font-black text-base">
                          {formatPrice(singleVariantPrice ?? Number(product.price))}
                        </span>
                      )}
                      {product.orderType !== "preorder" && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                          product.stock <= 5
                            ? "bg-red-100 text-red-600"
                            : product.stock <= 15
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}>
                          Còn {product.stock}
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
              {/* Row 4: tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.tags.map((t) => (
                    <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">{t}</span>
                  ))}
                </div>
              )}
              {/* Row 5: variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold shrink-0">Biến thể:</span>
                  {product.variants.map((v) => {
                    const vAny = v as any;
                    const trackStock = product.orderType !== "preorder" && product.orderType !== "slot";
                    const soldOut = (trackStock && v.stock != null && v.stock === 0) || !!vAny.soldOut;
                    const lowStock = trackStock && v.stock != null && v.stock > 0 && v.stock <= 5;
                    return (
                      <span key={v.name} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${soldOut ? "bg-red-50 text-red-400 border-red-200 line-through opacity-60" : "bg-muted text-foreground border-border"}`}>
                        {v.name}
                        {vAny.price != null && !soldOut && (
                          <span className="ml-0.5 font-bold text-primary">
                            {vAny.price >= 1000 ? `${Math.round(vAny.price / 1000)}K` : `${vAny.price}đ`}
                          </span>
                        )}
                        {soldOut && <span className="ml-0.5">hết</span>}
                        {lowStock && (
                          <span className="ml-0.5 text-orange-500 font-black">({v.stock})</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              size="sm"
              className={`shrink-0 rounded-xl font-bold px-3 mt-0.5 ${product.orderType === "slot" ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white" : ""}`}
              disabled={!product.isAvailable || (product.orderType !== "preorder" && product.orderType !== "slot" && product.stock === 0) || (() => { const vs = (product.variants ?? []) as Array<{ soldOut?: boolean }>; return vs.length > 0 ? vs.every((v) => v.soldOut) : !!(product as any).isSoldOut; })()}
              onClick={() => addToCart(product)}
              data-testid={`button-add-cart-${product.id}`}
            >
              {(product.orderType !== "preorder" && product.orderType !== "slot" && product.stock === 0) || (() => { const vs = (product.variants ?? []) as Array<{ soldOut?: boolean }>; return vs.length > 0 ? vs.every((v) => v.soldOut) : !!(product as any).isSoldOut; })()
                ? "Hết hàng"
                : product.orderType === "slot"
                  ? <>🎫 Đặt slot</>
                  : <><Plus size={13} className="mr-1" />Thêm</>}
            </Button>
          </div>
        );
        })}
      </div>

      {/* Variant picker dialog */}
      <Dialog open={!!variantPickerProduct} onOpenChange={(open) => { if (!open) { setVariantPickerProduct(null); setPickedVariant(null); } }}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {pickedVariant ? (
                <button className="flex items-center gap-1 text-sm font-black" onClick={() => setPickedVariant(null)}>
                  <span className="text-muted-foreground">←</span>
                  <span>{pickedVariant.name}</span>
                  <span className="text-muted-foreground font-normal text-[11px] ml-1">· chọn biến thể phụ</span>
                </button>
              ) : "Chọn biến thể"}
            </DialogTitle>
          </DialogHeader>
          {variantPickerProduct && !pickedVariant && (
            <div className="space-y-3">
              <p className="text-sm font-bold line-clamp-2">{variantPickerProduct.name}</p>
              <div className="flex flex-wrap gap-2">
                {variantPickerProduct.variants?.map((v) => {
                  const vAny = v as any;
                  const finalPrice = vAny.price != null ? vAny.price : Number(variantPickerProduct.price);
                  const trackStock = variantPickerProduct.orderType !== "preorder" && variantPickerProduct.orderType !== "slot";
                  const soldOut = (trackStock && v.stock != null && v.stock === 0) || !!vAny.soldOut;
                  const lowStock = trackStock && v.stock != null && v.stock > 0 && v.stock <= 5;
                  const hasSubs = (vAny.subVariants ?? []).length > 0;
                  return (
                    <button
                      key={v.name}
                      disabled={soldOut}
                      onClick={() => {
                        if (soldOut) return;
                        if (hasSubs) {
                          setPickedVariant(vAny);
                        } else {
                          doAddToCart(variantPickerProduct, v.name, finalPrice);
                          setVariantPickerProduct(null);
                          setPickedVariant(null);
                        }
                      }}
                      className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all ${soldOut ? "border-border bg-muted/40 text-muted-foreground opacity-50 cursor-not-allowed" : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/40 active:scale-95"}`}
                    >
                      <span className={`text-sm font-bold ${soldOut ? "line-through" : ""}`}>{v.name}</span>
                      {soldOut ? (
                        <span className="text-[10px] font-semibold text-red-400">Hết hàng</span>
                      ) : (
                        <span className="text-[10px] font-semibold opacity-80">{formatPrice(finalPrice)}</span>
                      )}
                      {lowStock && <span className="text-[9px] font-black text-orange-500 mt-0.5">còn {v.stock}</span>}
                      {hasSubs && !soldOut && <span className="text-[9px] font-black text-violet-500 mt-0.5">▸ chọn thêm</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {variantPickerProduct && pickedVariant && (
            <div className="space-y-3">
              <p className="text-sm font-bold line-clamp-2">{variantPickerProduct.name}</p>
              <div className="flex flex-wrap gap-2">
                {(pickedVariant.subVariants ?? []).map((sv) => {
                  const svAny = sv as any;
                  const variantBasePrice = (pickedVariant as any).price != null ? (pickedVariant as any).price : Number(variantPickerProduct.price);
                  const finalPrice = svAny.price != null ? svAny.price : variantBasePrice;
                  const trackStock = variantPickerProduct.orderType !== "preorder" && variantPickerProduct.orderType !== "slot";
                  const soldOut = (trackStock && sv.stock != null && sv.stock === 0) || !!sv.soldOut;
                  const lowStock = trackStock && sv.stock != null && sv.stock > 0 && sv.stock <= 5;
                  return (
                    <button
                      key={sv.name}
                      disabled={soldOut}
                      onClick={() => {
                        if (soldOut) return;
                        doAddToCart(variantPickerProduct, pickedVariant.name, finalPrice, sv.name);
                        setVariantPickerProduct(null);
                        setPickedVariant(null);
                      }}
                      className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all ${soldOut ? "border-border bg-muted/40 text-muted-foreground opacity-50 cursor-not-allowed" : "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-400 active:scale-95"}`}
                    >
                      <span className={`text-sm font-bold ${soldOut ? "line-through" : ""}`}>{sv.name}</span>
                      {soldOut ? (
                        <span className="text-[10px] font-semibold text-red-400">Hết hàng</span>
                      ) : (
                        <span className="text-[10px] font-semibold opacity-80">{formatPrice(finalPrice)}</span>
                      )}
                      {lowStock && <span className="text-[9px] font-black text-orange-500 mt-0.5">còn {sv.stock}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
