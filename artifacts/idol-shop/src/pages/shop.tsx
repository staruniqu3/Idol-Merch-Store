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
};

const cartKey = (productId: number, variant?: string) => `${productId}::${variant ?? ""}`;

const PRESET_CATEGORIES = ["Kpop", "GMMTV", "US UK", "Tạp Hoá"];

const orderTypeLabel: Record<string, string> = {
  preorder: "Pre-order",
  pickup: "Pickup",
  instock: "Hàng sẵn",
};

const orderTypeBadgeClass: Record<string, string> = {
  preorder: "bg-primary/15 text-primary border-primary/20",
  pickup: "bg-emerald-100 text-emerald-700 border-emerald-200",
  instock: "bg-amber-100 text-amber-700 border-amber-200",
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
  const createOrder = useCreateOrder();
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

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const doAddToCart = (product: typeof filtered[0], variantName?: string, variantPrice?: number) => {
    const key = cartKey(product.id, variantName);
    const finalPrice = variantPrice ?? product.price;
    setCart((prev) => {
      const existing = prev.find((i) => cartKey(i.productId, i.variant) === key);
      if (existing) return prev.map((i) => cartKey(i.productId, i.variant) === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: finalPrice, quantity: 1, orderType: product.orderType, imageUrl: product.imageUrl, variant: variantName }];
    });
    toast({ title: "Đã thêm vào giỏ hàng", description: variantName ? `${product.name} (${variantName})` : product.name });
  };

  const addToCart = (product: typeof filtered[0]) => {
    if (product.variants && product.variants.length > 0) {
      setVariantPickerProduct(product);
    } else {
      doAddToCart(product);
    }
  };

  const removeFromCart = (productId: number, variant?: string) => {
    const key = cartKey(productId, variant);
    setCart((prev) => prev.filter((i) => cartKey(i.productId, i.variant) !== key));
  };

  const changeQty = (productId: number, delta: number, variant?: string) => {
    const key = cartKey(productId, variant);
    setCart((prev) => prev.map((i) => cartKey(i.productId, i.variant) === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
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
          items: JSON.stringify(cart.map((i) => ({ productId: i.productId, name: i.variant ? `${i.name} (${i.variant})` : i.name, price: i.price, quantity: i.quantity }))),
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

  const handleClose = () => {
    setCartOpen(false);
    setStep("cart");
    setPhone("");
    setCart([]);
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
                  {step === "payment" ? "Thanh toán" : `Giỏ hàng (${cartCount})`}
                </SheetTitle>
              </SheetHeader>

              {/* ── STEP: PAYMENT SUCCESS ── */}
              {step === "payment" && (
                <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-black">Đặt hàng thành công! 🎉</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Shop đã nhận đơn của bạn.<br />Vui lòng chuyển khoản và điền form xác nhận.
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
                          <div key={cartKey(item.productId, item.variant)} className="flex gap-3 p-2.5 bg-muted/60 rounded-2xl" data-testid={`cart-item-${item.productId}`}>
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
                              {item.variant && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">{item.variant}</span>
                              )}
                              <p className="text-xs text-primary font-black mt-0.5">{formatPrice(item.price)}</p>
                              <div className="flex items-center gap-1 mt-1.5">
                                <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => changeQty(item.productId, -1, item.variant)} data-testid={`button-minus-${item.productId}`}><Minus size={10} /></Button>
                                <span className="w-5 text-center text-sm font-black">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => changeQty(item.productId, 1, item.variant)} data-testid={`button-plus-${item.productId}`}><Plus size={10} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-destructive ml-1" onClick={() => removeFromCart(item.productId, item.variant)} data-testid={`button-remove-${item.productId}`}><X size={10} /></Button>
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
                        <Button className="w-full rounded-xl font-bold" onClick={() => setStep("checkout")} data-testid="button-checkout">
                          Đặt hàng ngay
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
                      className="w-full rounded-xl font-bold"
                      onClick={handleCheckout}
                      disabled={createOrder.isPending}
                      data-testid="button-place-order"
                    >
                      {createOrder.isPending ? "Đang xử lý..." : "Xác nhận đặt hàng"}
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

        {filtered.filter((p) => p.isAvailable).map((product) => (
          <div
            key={product.id}
            className="bg-card rounded-2xl border border-border px-4 py-3 flex items-start gap-3 shadow-sm"
            data-testid={`card-product-${product.id}`}
          >
            <div className="flex-1 min-w-0">
              {/* Row 1: badges */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <Badge className={`text-[10px] border font-bold px-2 py-0 shrink-0 ${orderTypeBadgeClass[product.orderType] ?? ""}`} variant="outline">
                  {orderTypeLabel[product.orderType] ?? product.orderType}
                </Badge>
                {product.orderType !== "preorder" && product.stock <= 5 && product.stock > 0 && (
                  <Badge className="text-[10px] bg-red-100 text-red-600 border-red-200 font-bold px-2 py-0 shrink-0" variant="outline">
                    Gần hết
                  </Badge>
                )}
              </div>
              {/* Row 2: name */}
              <p className="text-sm font-bold leading-snug text-foreground">{product.name}</p>
              {/* Row 3: price + stock */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary font-black text-base">{formatPrice(product.price)}</span>
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
                    const trackStock = product.orderType !== "preorder";
                    const soldOut = trackStock && v.stock != null && v.stock === 0;
                    const lowStock = trackStock && v.stock != null && v.stock > 0 && v.stock <= 5;
                    return (
                      <span key={v.name} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${soldOut ? "bg-red-50 text-red-400 border-red-200 line-through opacity-60" : "bg-muted text-foreground border-border"}`}>
                        {v.name}
                        {v.priceAdjustment != null && v.priceAdjustment !== 0 && !soldOut && (
                          <span className={`ml-0.5 font-bold ${v.priceAdjustment > 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {v.priceAdjustment > 0 ? "+" : ""}{new Intl.NumberFormat("vi-VN").format(v.priceAdjustment)}₫
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
              className="shrink-0 rounded-xl font-bold px-3 mt-0.5"
              disabled={!product.isAvailable || (product.orderType !== "preorder" && product.stock === 0)}
              onClick={() => addToCart(product)}
              data-testid={`button-add-cart-${product.id}`}
            >
              {product.orderType !== "preorder" && product.stock === 0 ? "Hết" : <><Plus size={13} className="mr-1" />Thêm</>}
            </Button>
          </div>
        ))}
      </div>

      {/* Variant picker dialog */}
      <Dialog open={!!variantPickerProduct} onOpenChange={(open) => { if (!open) setVariantPickerProduct(null); }}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Chọn biến thể</DialogTitle>
          </DialogHeader>
          {variantPickerProduct && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold line-clamp-2">{variantPickerProduct.name}</p>
                <p className="text-xs text-primary font-black mt-0.5">{formatPrice(variantPickerProduct.price)} (giá gốc)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {variantPickerProduct.variants?.map((v) => {
                  const finalPrice = variantPickerProduct.price + (v.priceAdjustment ?? 0);
                  const hasAdj = v.priceAdjustment != null && v.priceAdjustment !== 0;
                  const trackStock = variantPickerProduct.orderType !== "preorder";
                  const soldOut = trackStock && v.stock != null && v.stock === 0;
                  const lowStock = trackStock && v.stock != null && v.stock > 0 && v.stock <= 5;
                  return (
                    <button
                      key={v.name}
                      disabled={soldOut}
                      onClick={() => {
                        if (soldOut) return;
                        doAddToCart(variantPickerProduct, v.name, finalPrice);
                        setVariantPickerProduct(null);
                      }}
                      className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all ${soldOut ? "border-border bg-muted/40 text-muted-foreground opacity-50 cursor-not-allowed" : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/40 active:scale-95"}`}
                    >
                      <span className={`text-sm font-bold ${soldOut ? "line-through" : ""}`}>{v.name}</span>
                      {soldOut ? (
                        <span className="text-[10px] font-semibold text-red-400">Hết hàng</span>
                      ) : hasAdj ? (
                        <span className="text-[10px] font-semibold opacity-80">
                          {formatPrice(finalPrice)}
                          <span className={`ml-1 ${(v.priceAdjustment ?? 0) > 0 ? "text-emerald-600" : "text-destructive"}`}>
                            ({(v.priceAdjustment ?? 0) > 0 ? "+" : ""}{new Intl.NumberFormat("vi-VN").format(v.priceAdjustment ?? 0)}₫)
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold opacity-60">{formatPrice(finalPrice)}</span>
                      )}
                      {lowStock && <span className="text-[9px] font-black text-orange-500 mt-0.5">còn {v.stock}</span>}
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
