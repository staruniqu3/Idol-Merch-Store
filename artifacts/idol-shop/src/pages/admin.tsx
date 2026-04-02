import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts, getListProductsQueryKey, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListOrders, getListOrdersQueryKey, useUpdateOrder,
  useListShippingUpdates, getListShippingUpdatesQueryKey, useCreateShippingUpdate, useUpdateShippingUpdate, useDeleteShippingUpdate,
  useListMembers, getListMembersQueryKey, useCreateMember, useAddPoints,
  useListRewards, getListRewardsQueryKey, useCreateReward, useDeleteReward,
  useGetOrderSummary,
} from "@workspace/api-client-react";
import {
  Shield, Package, ShoppingBag, Truck, Users, Gift, LogOut, Plus, Pencil, Trash2, ChevronDown,
  TrendingUp, Star, Calendar, X, Check, BarChart3, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

const ADMIN_PASSWORD = "admin123";

function formatPrice(p: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const statusOptions = ["awaiting", "confirmed", "pending", "shipped", "delivered", "cancelled"];
const statusLabels: Record<string, string> = {
  awaiting: "Chờ xác nhận", pending: "Đã nhập thông tin", confirmed: "Đã chuyển khoản", shipped: "Đang giao", delivered: "Đã giao", cancelled: "Đã hủy",
};
const statusColors: Record<string, string> = {
  awaiting: "bg-gray-100 text-gray-600", pending: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700", delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const shippingStatusOptions = ["web_order", "warehouse_origin", "warehouse_vn", "sorting", "preparing", "in_transit", "delivered", "returned"];
const shippingStatusLabels: Record<string, string> = {
  web_order: "Web trả hàng",
  warehouse_origin: "Đã về kho tại nước sở tại",
  warehouse_vn: "Về kho Việt",
  sorting: "Phân loại hàng",
  preparing: "Chuẩn bị giao",
  in_transit: "Đang giao",
  arrived: "Đã về kho",
  delivered: "Đã giao",
  returned: "Trả đơn toàn bộ",
};

const tierColors: Record<string, string> = {
  bronze: "text-orange-600", silver: "text-slate-500", gold: "text-amber-500", platinum: "text-violet-600",
};

// ===================== Login =====================
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs bg-card border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-black text-center mb-1">Admin Panel</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">Nhập mật khẩu để tiếp tục</p>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && (pw === ADMIN_PASSWORD ? onLogin() : setError(true))}
            data-testid="input-admin-password"
            className="rounded-xl"
          />
          {error && <p className="text-destructive text-xs font-semibold">Mật khẩu không đúng</p>}
          <Button
            className="w-full rounded-xl font-bold"
            onClick={() => { if (pw === ADMIN_PASSWORD) { onLogin(); } else { setError(true); } }}
            data-testid="button-admin-login"
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===================== Dashboard =====================
function DashboardTab() {
  const { data: summary } = useGetOrderSummary();
  const { data: members } = useListMembers();
  const { data: products } = useListProducts();

  const stats = [
    { label: "Tổng đơn hàng", value: summary?.totalOrders ?? 0, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Doanh thu", value: summary ? formatPrice(summary.totalRevenue) : "0đ", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Thành viên", value: members?.length ?? 0, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Sản phẩm", value: products?.length ?? 0, icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-lg font-black">{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {summary && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> Theo trạng thái</h3>
          {Object.entries({ pending: summary.pendingOrders, shipped: summary.shippedOrders, delivered: summary.deliveredOrders } as Record<string, number>).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <Badge className={`text-[10px] ${statusColors[status] ?? ""}`} variant="secondary">
                {statusLabels[status] ?? status}
              </Badge>
              <span className="font-bold text-sm">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== Products =====================
function ProductsTab() {
  const { data: products } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  type VariantDraft = { name: string; price?: number; stock?: number };
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "Kpop", stock: "0", isAvailable: true, orderType: "preorder", orderLabel: "", orderName: "", imageUrl: "", tags: [] as string[], variants: [] as VariantDraft[] });
  const [customTagInput, setCustomTagInput] = useState("");
  const [customVariantInput, setCustomVariantInput] = useState({ name: "", price: "", stock: "" });
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("custom_categories") || "[]"); } catch { return []; }
  });

  const PRESET_CATEGORIES = ["Kpop", "GMMTV", "US UK", "Tạp Hoá"];
  const allCategories = [...PRESET_CATEGORIES, ...customCategories];

  const addCustomCategory = () => {
    const cat = customCategoryInput.trim();
    if (!cat || allCategories.includes(cat)) { setCustomCategoryInput(""); return; }
    const updated = [...customCategories, cat];
    setCustomCategories(updated);
    localStorage.setItem("custom_categories", JSON.stringify(updated));
    setForm((f) => ({ ...f, category: cat }));
    setCustomCategoryInput("");
  };

  const removeCustomCategory = (cat: string) => {
    const updated = customCategories.filter((c) => c !== cat);
    setCustomCategories(updated);
    localStorage.setItem("custom_categories", JSON.stringify(updated));
    if (form.category === cat) setForm((f) => ({ ...f, category: PRESET_CATEGORIES[0] }));
  };

  const PRESET_TAGS = [
    "Photocard Set", "Album Standard", "Album Special", "Lightstick",
    "Plush", "Keychain", "Poster", "Slogan", "Wappen",
    "PC Holder", "Standee", "Fan", "Acrylic", "Sticker Pack",
    "Weverse Album", "Limited Edition", "Merch Bundle",
  ];

  const resetForm = () => { setForm({ name: "", description: "", price: "", category: "Kpop", stock: "0", isAvailable: true, orderType: "preorder", orderLabel: "", orderName: "", imageUrl: "", tags: [], variants: [] }); setCustomTagInput(""); setCustomVariantInput({ name: "", price: "", stock: "" }); };

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (!tag || form.tags.includes(tag)) { setCustomTagInput(""); return; }
    setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setCustomTagInput("");
  };

  const openEdit = (p: NonNullable<typeof products>[0]) => {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), category: p.category, stock: String(p.stock), isAvailable: p.isAvailable, orderType: p.orderType, orderLabel: (p as any).orderLabel ?? "", orderName: (p as any).orderName ?? "", imageUrl: p.imageUrl ?? "", tags: p.tags ?? [], variants: (p.variants ?? []).map((v: any) => ({ name: v.name, price: v.price ?? undefined, stock: v.stock ?? undefined })) });
    setOpen(true);
  };

  const handleSave = () => {
    try {
      const isPreorder = form.orderType === "preorder";
      const cleanVariants = form.variants.map((v) => ({
        name: v.name,
        ...(v.price != null && !isNaN(v.price) ? { price: v.price } : {}),
        ...(!isPreorder && v.stock != null && !isNaN(v.stock) ? { stock: v.stock } : {}),
      }));
      const vPrices = cleanVariants.map((v) => (v as any).price).filter((p: any) => p != null && !isNaN(p)) as number[];
      const autoMinPrice = vPrices.length >= 1 ? Math.min(...vPrices) : null;
      const effectivePriceStr = autoMinPrice != null ? String(autoMinPrice) : form.price;
      if (!form.name || !effectivePriceStr) { toast({ title: "Vui lòng nhập đủ thông tin", variant: "destructive" }); return; }
      const price = parseFloat(effectivePriceStr);
      if (isNaN(price)) { toast({ title: "Giá không hợp lệ", variant: "destructive" }); return; }
      const hasVariantStock = !isPreorder && cleanVariants.length > 0 && cleanVariants.every((v) => v.stock != null);
      const stock = hasVariantStock
        ? cleanVariants.reduce((s, v) => s + (v.stock ?? 0), 0)
        : parseInt(form.stock) || 0;
      const data = { name: form.name, description: form.description || null, price, category: form.category, stock, isAvailable: form.isAvailable, orderType: form.orderType, orderLabel: form.orderLabel.trim() || null, orderName: form.orderName.trim() || null, imageUrl: form.imageUrl || null, tags: form.tags.length > 0 ? form.tags : null, variants: cleanVariants.length > 0 ? cleanVariants : null };
      if (editId) {
        updateProduct.mutate({ id: editId, data }, {
          onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); resetForm(); setEditId(null); toast({ title: "Đã cập nhật sản phẩm" }); },
          onError: (err: unknown) => { toast({ title: "Lỗi khi lưu sản phẩm", description: err instanceof Error ? err.message : "Vui lòng thử lại", variant: "destructive" }); },
        });
      } else {
        createProduct.mutate({ data }, {
          onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); resetForm(); toast({ title: "Đã thêm sản phẩm mới" }); },
          onError: (err: unknown) => { toast({ title: "Lỗi khi thêm sản phẩm", description: err instanceof Error ? err.message : "Vui lòng thử lại", variant: "destructive" }); },
        });
      }
    } catch (err) {
      toast({ title: "Lỗi không xác định", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Sản Phẩm ({products?.length ?? 0})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setEditId(null); setOpen(true); }} data-testid="button-add-product">
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Tên sản phẩm *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" data-testid="input-product-name" />
            </div>
            <div>
              <Label>Tên Order</Label>
              <Input
                value={form.orderName}
                onChange={(e) => setForm({ ...form, orderName: e.target.value })}
                placeholder="vd: PO BTS Spring 2025, PO Tháng 5..."
                className="rounded-xl mt-1"
                data-testid="input-order-name"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Tên đợt PO / batch — hiện trên thẻ sản phẩm</p>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_TAGS.map((tag) => {
                  const selected = form.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        tags: selected ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
                      }))}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-colors border ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-primary/10 text-primary hover:bg-primary/20 border-primary/15"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
                {form.tags.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
                  <span key={tag} className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary text-primary-foreground border border-primary">
                    {tag}
                    <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))} className="ml-0.5 hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                <Input
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                  placeholder="Tạo tag mới..."
                  className="rounded-xl h-8 text-xs"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="shrink-0 h-8 px-3 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/15 transition-colors"
                >
                  + Thêm
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-3 space-y-3">
              <div>
                <p className="text-sm font-semibold">Biến thể</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Muvmuv, Lunar, Size S... — nhập giá tuyệt đối cho từng biến thể (để trống = dùng giá gốc)</p>
              </div>
              {form.variants.length > 0 && (
                <div className="space-y-1.5">
                  {form.variants.map((v, idx) => {
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-background rounded-xl px-3 py-1.5 border border-border">
                        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-foreground">{v.name}</span>
                          {v.price != null && (
                            <span className="text-[10px] font-bold text-primary">
                              {new Intl.NumberFormat("vi-VN").format(v.price)}₫
                            </span>
                          )}
                          {v.stock != null && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">kho: {v.stock}</span>
                          )}
                        </div>
                        {form.orderType !== "preorder" && (
                          <Input
                            type="number"
                            min="0"
                            value={v.stock != null ? String(v.stock) : ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((f) => ({
                                ...f,
                                variants: f.variants.map((vv, i) =>
                                  i === idx ? { ...vv, stock: val === "" ? undefined : parseInt(val) } : vv
                                ),
                              }));
                            }}
                            placeholder="Kho"
                            className="rounded-lg h-7 text-xs w-16 bg-muted/50 shrink-0"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors shrink-0 text-base leading-none"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 pt-1 border-t border-border/60">
                <Input
                  value={customVariantInput.name}
                  onChange={(e) => setCustomVariantInput((s) => ({ ...s, name: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const name = customVariantInput.name.trim();
                      if (!name) return;
                      const p = customVariantInput.price.trim();
                      const price = p ? parseFloat(p) : undefined;
                      const stk = customVariantInput.stock.trim();
                      const stock = stk ? parseInt(stk) : undefined;
                      setForm((f) => ({ ...f, variants: [...f.variants, { name, price, stock }] }));
                      setCustomVariantInput({ name: "", price: "", stock: "" });
                    }
                  }}
                  placeholder="Tên biến thể..."
                  className="rounded-xl h-8 text-xs flex-1 bg-background"
                />
                <Input
                  value={customVariantInput.price}
                  onChange={(e) => setCustomVariantInput((s) => ({ ...s, price: e.target.value }))}
                  placeholder="Giá (VND)"
                  type="number"
                  className="rounded-xl h-8 text-xs w-28 bg-background"
                />
                {form.orderType !== "preorder" && (
                  <Input
                    value={customVariantInput.stock}
                    onChange={(e) => setCustomVariantInput((s) => ({ ...s, stock: e.target.value }))}
                    placeholder="Kho"
                    type="number"
                    min="0"
                    className="rounded-xl h-8 text-xs w-16 bg-background"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    const name = customVariantInput.name.trim();
                    if (!name) return;
                    const p = customVariantInput.price.trim();
                    const price = p ? parseFloat(p) : undefined;
                    const stk = customVariantInput.stock.trim();
                    const stock = stk ? parseInt(stk) : undefined;
                    setForm((f) => ({ ...f, variants: [...f.variants, { name, price, stock }] }));
                    setCustomVariantInput({ name: "", price: "", stock: "" });
                  }}
                  className="shrink-0 h-8 px-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  + Thêm
                </button>
              </div>
            </div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="rounded-xl mt-1" /></div>
            {(() => {
              const isPreorder = form.orderType === "preorder";
              const hasVariantStock = !isPreorder && form.variants.length > 0 && form.variants.every((v) => v.stock != null && !isNaN(v.stock as number));
              const autoStock = hasVariantStock ? form.variants.reduce((s, v) => s + (v.stock ?? 0), 0) : null;
              const vPrices = form.variants.map((v) => v.price).filter((p) => p != null && !isNaN(p as number)) as number[];
              const hasPriceRange = vPrices.length >= 2 && Math.min(...vPrices) !== Math.max(...vPrices);
              const fmtK = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
              return (
                <div className="grid grid-cols-2 gap-2">
                  {hasPriceRange ? (
                    <div>
                      <Label>Giá (VND)</Label>
                      <div className="rounded-xl mt-1 h-9 border border-secondary/40 bg-secondary/5 flex items-center justify-between px-3">
                        <span className="text-sm font-black text-secondary">{fmtK(Math.min(...vPrices))} – {fmtK(Math.max(...vPrices))}</span>
                        <span className="text-[10px] text-secondary/60 font-semibold">tự động từ biến thể</span>
                      </div>
                    </div>
                  ) : (
                    <div><Label>Giá (VND) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl mt-1" data-testid="input-product-price" /></div>
                  )}
                  {isPreorder ? (
                    <div>
                      <Label className="text-muted-foreground">Tồn kho</Label>
                      <div className="rounded-xl mt-1 h-9 border border-dashed border-border bg-muted/30 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">Không cần — Pre-order</span>
                      </div>
                    </div>
                  ) : autoStock !== null ? (
                    <div>
                      <Label>Tồn kho tổng</Label>
                      <div className="rounded-xl mt-1 h-9 border border-primary/30 bg-primary/5 flex items-center justify-between px-3">
                        <span className="text-sm font-black text-primary">{autoStock}</span>
                        <span className="text-[10px] text-primary/60 font-semibold">tự động từ biến thể</span>
                      </div>
                    </div>
                  ) : (
                    <div><Label>Tồn kho</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl mt-1" /></div>
                  )}
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        <span className="flex items-center justify-between w-full gap-2">
                          {c}
                          {!PRESET_CATEGORIES.includes(c) && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeCustomCategory(c); }}
                              className="ml-2 text-destructive hover:opacity-70 text-xs leading-none"
                            >×</button>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5 mt-1.5">
                  <Input
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
                    placeholder="Thêm danh mục..."
                    className="rounded-xl h-7 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addCustomCategory}
                    className="shrink-0 h-7 px-2.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/15 transition-colors"
                  >+</button>
                </div>
              </div>
              <div>
                <Label>Loại đặt hàng</Label>
                <Select value={form.orderType} onValueChange={(v) => setForm({ ...form, orderType: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preorder">Pre-order</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="instock">Hàng sẵn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tên loại (hiển thị)</Label>
              <Input
                value={form.orderLabel}
                onChange={(e) => setForm({ ...form, orderLabel: e.target.value })}
                placeholder={form.orderType === "preorder" ? "vd: Mở PO, Flash Sale..." : form.orderType === "pickup" ? "vd: Pickup tháng 5..." : "vd: Deal Flash, Hàng về..."}
                className="rounded-xl mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Hiện như badge trên card sản phẩm — để trống sẽ hiện loại mặc định</p>
            </div>
            <div><Label>URL ảnh</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="rounded-xl mt-1" /></div>
            <div className="flex items-center gap-3 py-1">
              <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} id="avail" />
              <Label htmlFor="avail">Đang bán</Label>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSave} data-testid="button-save-product">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {products?.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3" data-testid={`admin-product-${p.id}`}>
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
              <Package size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {(() => {
                  const vPrices = (p.variants ?? []).map((v) => (v as any).price).filter((x: any) => x != null) as number[];
                  if (vPrices.length >= 2) {
                    const mn = Math.min(...vPrices), mx = Math.max(...vPrices);
                    return <span className="text-xs text-primary font-bold">{formatPrice(mn)} – {formatPrice(mx)}</span>;
                  }
                  return <span className="text-xs text-primary font-bold">{formatPrice(vPrices[0] ?? p.price)}</span>;
                })()}
                <span className="text-xs text-muted-foreground">Kho: {p.stock}</span>
                <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-semibold">
                  {(p as any).orderLabel ?? p.orderType}
                </span>
                {!p.isAvailable && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">Tắt</Badge>}
              </div>
              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}><Pencil size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => deleteProduct.mutate({ id: p.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }) })} data-testid={`button-delete-product-${p.id}`}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Orders =====================
function OrderAddressInfo({ phone }: { phone: string }) {
  const [address, setAddress] = useState<string | null>(null);
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  useEffect(() => {
    fetch(`${base}/api/sheets/member-profile?phone=${encodeURIComponent(phone)}&_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.address) setAddress(data.address); })
      .catch(() => {});
  }, [phone]);

  if (!address) return null;
  return (
    <div className="text-xs bg-blue-50 border border-blue-100 rounded-xl p-2 text-blue-800 space-y-0.5">
      <p className="font-bold">📍 Địa chỉ giao hàng (Sovereign Club)</p>
      <p>{address}</p>
    </div>
  );
}

type OrderItem = { id: number; trackingNumber?: string | null; shippingCarrier?: string | null; shippingFee?: number | null; status: string };

function TrackingFieldsEditor({ orderId, order }: { orderId: number; order: OrderItem }) {
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order.shippingCarrier ?? "");
  const [fee, setFee] = useState(order.shippingFee != null ? String(order.shippingFee) : "");

  const CARRIERS = ["Shopee Express", "GHN", "GHTK", "J&T Express", "Viettel Post", "Vietnam Post", "Ninja Van", "DHL", "FedEx"];

  const handleSave = () => {
    updateOrder.mutate({ id: orderId, data: {
      trackingNumber: tracking.trim() || null,
      shippingCarrier: carrier.trim() || null,
      shippingFee: fee.trim() ? parseFloat(fee) : null,
    }}, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }); toast({ title: "Đã lưu thông tin vận đơn" }); },
    });
  };

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <Label className="text-xs font-bold">Thông tin vận đơn</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Mã vận đơn</Label>
          <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="SPXVN..." className="rounded-xl h-8 text-xs mt-0.5 font-mono" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Phí vận chuyển (đ)</Label>
          <Input value={fee} onChange={(e) => setFee(e.target.value)} type="number" placeholder="50000" className="rounded-xl h-8 text-xs mt-0.5" />
        </div>
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">Đơn vị vận chuyển</Label>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {CARRIERS.map((c) => (
            <button key={c} type="button" onClick={() => setCarrier(c === carrier ? "" : c)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors font-semibold ${carrier === c ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/40"}`}>
              {c}
            </button>
          ))}
        </div>
        <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Tên ĐVVC khác..." className="rounded-xl h-8 text-xs mt-1.5" />
      </div>
      <Button size="sm" onClick={handleSave} className="w-full rounded-xl font-bold" disabled={updateOrder.isPending}>
        Lưu thông tin vận đơn
      </Button>
    </div>
  );
}

function OrdersTab() {
  const { data: orders } = useListOrders();
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${base}/api/orders/cleanup`, { method: "DELETE" }).catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="font-bold">Đơn Hàng ({orders?.length ?? 0})</h3>
      <div className="space-y-2">
        {orders && [...orders].reverse().map((order) => {
          let items: Array<{ name: string; quantity: number; price: number }> = [];
          try { items = JSON.parse(order.items); } catch {}
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden" data-testid={`admin-order-${order.id}`}>
              <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">#{order.id} · {order.memberName}</span>
                    <Badge className={`text-[10px] ${statusColors[order.status] ?? ""}`} variant="secondary">
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.memberPhone} · {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-primary">{formatPrice(order.totalAmount)}</span>
                  <ChevronDown size={14} className={`transition-transform text-muted-foreground ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border p-3 space-y-3 bg-muted/30">
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.name} ×{item.quantity}</span>
                        <span className="text-muted-foreground font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <OrderAddressInfo phone={order.memberPhone} />
                  {order.notes && <p className="text-xs bg-amber-50 border border-amber-100 rounded-xl p-2 text-amber-700">📝 {order.notes}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Mã đơn: <span className="font-bold text-foreground font-mono">TCD{String(order.id).padStart(7, "0")}</span></span>
                    {order.trackingNumber && (
                      <span>Mã vận đơn: <span className="font-bold text-foreground font-mono">{order.trackingNumber}</span></span>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Cập nhật trạng thái</Label>
                    <Select value={order.status} onValueChange={(v) => {
                      updateOrder.mutate({ id: order.id, data: { status: v } }, {
                        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }); toast({ title: "Đã cập nhật" }); },
                      });
                    }}>
                      <SelectTrigger className="mt-1 rounded-xl" data-testid={`select-status-${order.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <TrackingFieldsEditor orderId={order.id} order={order} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== Shipping =====================
function ShippingTab() {
  const { data: updates } = useListShippingUpdates();
  const createUpdate = useCreateShippingUpdate();
  const updateUpdate = useUpdateShippingUpdate();
  const deleteUpdate = useDeleteShippingUpdate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "preparing", estimatedDate: "" });

  const resetForm = () => setForm({ title: "", description: "", status: "preparing", estimatedDate: "" });
  const openEdit = (u: NonNullable<typeof updates>[0]) => {
    setEditId(u.id); setForm({ title: u.title, description: u.description, status: u.status, estimatedDate: u.estimatedDate ?? "" }); setOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.description) { toast({ title: "Nhập đủ thông tin", variant: "destructive" }); return; }
    const data = { title: form.title, description: form.description, status: form.status, estimatedDate: form.estimatedDate || null };
    if (editId) {
      updateUpdate.mutate({ id: editId, data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }); setOpen(false); resetForm(); setEditId(null); toast({ title: "Đã cập nhật" }); } });
    } else {
      createUpdate.mutate({ data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }); setOpen(false); resetForm(); toast({ title: "Đã thêm cập nhật vận chuyển" }); } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Vận Chuyển ({updates?.length ?? 0})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setEditId(null); setOpen(true); }} data-testid="button-add-shipping">
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa cập nhật" : "Thêm cập nhật vận chuyển"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl mt-1" data-testid="input-shipping-title" /></div>
            <div><Label>Mô tả *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-xl mt-1" /></div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {shippingStatusOptions.map((s) => <SelectItem key={s} value={s}>{shippingStatusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ngày dự kiến</Label><Input type="date" value={form.estimatedDate} onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })} className="rounded-xl mt-1" /></div>
            <Button className="w-full rounded-xl" onClick={handleSave} data-testid="button-save-shipping">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {updates && [...updates].reverse().map((u) => (
          <div key={u.id} className="bg-card border border-border rounded-2xl p-3 flex items-start gap-3" data-testid={`admin-shipping-${u.id}`}>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{u.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.description}</p>
              <Badge variant="outline" className="text-[10px] mt-1 rounded-full">{shippingStatusLabels[u.status] ?? u.status}</Badge>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(u)}><Pencil size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => deleteUpdate.mutate({ id: u.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }) })}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Pre-order Schedule =====================
interface PreorderItem {
  id: number; title: string; description: string | null; startDate: string | null; deadline: string | null; pickupDate: string | null; pickupDeadline: string | null;
  imageUrl: string | null; artist: string | null; isActive: boolean; createdAt: string;
}

function PreorderTab() {
  const [items, setItems] = useState<PreorderItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"po" | "pickup">("po");
  const [form, setForm] = useState({ title: "", description: "", startDate: "", deadline: "", pickupDate: "", pickupDeadline: "", artist: "", imageUrl: "", isActive: true });
  const { toast } = useToast();

  const fetchItems = () => {
    fetch(`${getBaseUrl()}/api/preorder-schedule`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .catch(() => {});
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => { setForm({ title: "", description: "", startDate: "", deadline: "", pickupDate: "", pickupDeadline: "", artist: "", imageUrl: "", isActive: true }); setScheduleMode("po"); };

  const openEdit = (item: PreorderItem) => {
    setEditId(item.id);
    const mode = (item.pickupDate || item.pickupDeadline) ? "pickup" : "po";
    setScheduleMode(mode);
    setForm({ title: item.title, description: item.description ?? "", startDate: item.startDate ?? "", deadline: item.deadline ?? "", pickupDate: item.pickupDate ?? "", pickupDeadline: item.pickupDeadline ?? "", artist: item.artist ?? "", imageUrl: item.imageUrl ?? "", isActive: item.isActive });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast({ title: "Nhập tiêu đề", variant: "destructive" }); return; }
    const body = {
      title: form.title,
      description: form.description || null,
      startDate: form.startDate || null,
      deadline: scheduleMode === "po" ? (form.deadline || null) : null,
      pickupDate: scheduleMode === "pickup" ? (form.pickupDate || null) : null,
      pickupDeadline: scheduleMode === "pickup" ? (form.pickupDeadline || null) : null,
      artist: form.artist || null,
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
    };
    const url = editId ? `${getBaseUrl()}/api/preorder-schedule/${editId}` : `${getBaseUrl()}/api/preorder-schedule`;
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchItems(); setOpen(false); resetForm(); setEditId(null);
    toast({ title: editId ? "Đã cập nhật lịch pre-order" : "Đã thêm lịch pre-order" });
  };

  const handleDelete = async (id: number) => {
    await fetch(`${getBaseUrl()}/api/preorder-schedule/${id}`, { method: "DELETE" });
    fetchItems(); toast({ title: "Đã xóa" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Lịch Pre-order ({items.length})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setEditId(null); setOpen(true); }} data-testid="button-add-preorder">
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa lịch pre-order" : "Thêm lịch pre-order"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl mt-1" /></div>
            <div><Label>Nghệ sĩ / Nhóm</Label><Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} placeholder="BTS, aespa, NewJeans..." className="rounded-xl mt-1" /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="rounded-xl mt-1" /></div>

            <div>
              <Label className="mb-1.5 block">Loại lịch</Label>
              <div className="flex rounded-xl border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setScheduleMode("po")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${scheduleMode === "po" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  📅 Deadline đặt hàng
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("pickup")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${scheduleMode === "pickup" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  🛍️ Lịch đi mua hàng tại store
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div><Label>{scheduleMode === "pickup" ? "Bắt đầu đi pickup" : "Bắt đầu PO"}</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl mt-1" /></div>
              {scheduleMode === "po" && (
                <div><Label>Deadline PO</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-xl mt-1" /></div>
              )}
              {scheduleMode === "pickup" && (
                <div><Label className="text-emerald-700 dark:text-emerald-400">Deadline pickup</Label><Input type="date" value={form.pickupDeadline} onChange={(e) => setForm({ ...form, pickupDeadline: e.target.value })} className="rounded-xl mt-1" /></div>
              )}
            </div>

            <div><Label>URL ảnh</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="rounded-xl mt-1" /></div>
            <div className="flex items-center gap-3 py-1">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="isActive" />
              <Label htmlFor="isActive">Đang mở pre-order</Label>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSave}>Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className={`bg-card border rounded-2xl p-3 flex items-start gap-3 ${!item.isActive ? "opacity-60" : "border-border"}`} data-testid={`admin-preorder-${item.id}`}>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{item.title}</p>
              {item.artist && <p className="text-xs text-primary font-semibold mt-0.5">{item.artist}</p>}
              <div className="flex flex-wrap gap-x-3 mt-0.5">
                {item.startDate && !item.pickupDeadline && <p className="text-xs text-muted-foreground">Bắt đầu: {item.startDate}</p>}
                {item.deadline && <p className="text-xs text-muted-foreground">Deadline: {item.deadline}</p>}
                {item.pickupDeadline && <p className="text-xs text-emerald-600 font-medium">🛍️ Pickup{item.startDate ? `: ${item.startDate}` : ""} · deadline {item.pickupDeadline}</p>}
              </div>
              {!item.isActive && <Badge variant="secondary" className="text-[10px] mt-1">Đã đóng</Badge>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(item)}><Pencil size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar size={28} strokeWidth={1.2} className="mx-auto mb-2" />
            <p className="text-sm">Chưa có lịch pre-order</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== Statistics =====================
const STATS_ACCOUNTED_KEY = "stats_accounted_order_ids";
const STATS_ORDERED_ITEMS_KEY = "stats_ordered_items";

function StatsTab() {
  const { data: orders } = useListOrders();

  const [accountedIds, setAccountedIds] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STATS_ACCOUNTED_KEY) || "[]")); } catch { return new Set(); }
  });
  const [orderedItems, setOrderedItems] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STATS_ORDERED_ITEMS_KEY) || "[]")); } catch { return new Set(); }
  });

  const activeOrders = (orders ?? []).filter(
    (o) => o.status === "confirmed" && !accountedIds.has(o.id)
  );

  const itemMap: Record<string, { qty: number; revenue: number }> = {};
  activeOrders.forEach((order) => {
    try {
      const items: Array<{ name: string; quantity: number; price: number }> = JSON.parse(order.items);
      items.forEach((it) => {
        if (!itemMap[it.name]) itemMap[it.name] = { qty: 0, revenue: 0 };
        itemMap[it.name].qty += it.quantity;
        itemMap[it.name].revenue += it.price * it.quantity;
      });
    } catch {}
  });

  const toggleOrdered = (name: string) => {
    setOrderedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      localStorage.setItem(STATS_ORDERED_ITEMS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const handleComplete = () => {
    const newAccounted = new Set([...accountedIds, ...activeOrders.map((o) => o.id)]);
    setAccountedIds(newAccounted);
    localStorage.setItem(STATS_ACCOUNTED_KEY, JSON.stringify([...newAccounted]));
    setOrderedItems(new Set());
    localStorage.removeItem(STATS_ORDERED_ITEMS_KEY);
  };

  const allEntries = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty);
  const pending = allEntries.filter(([name]) => !orderedItems.has(name));
  const done = allEntries.filter(([name]) => orderedItems.has(name));
  const sorted = [...pending, ...done];
  const totalItems = allEntries.reduce((s, [, v]) => s + v.qty, 0);
  const pendingItems = pending.reduce((s, [, v]) => s + v.qty, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Thống Kê Số Lượng Hàng Cần Đặt</h3>
          {activeOrders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{activeOrders.length} đơn Đã chuyển khoản</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {done.length > 0 && (
            <button
              type="button"
              onClick={() => { setOrderedItems(new Set()); localStorage.removeItem(STATS_ORDERED_ITEMS_KEY); }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Bỏ chọn
            </button>
          )}
          {activeOrders.length > 0 && (
            <button
              type="button"
              onClick={handleComplete}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-600/30 hover:border-emerald-600/60 px-2.5 py-1 rounded-lg bg-emerald-50/50 transition-colors"
            >
              ✓ Hoàn thành lô
            </button>
          )}
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Package size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-2xl font-black">{pendingItems}<span className="text-sm font-normal text-muted-foreground"> / {totalItems}</span></p>
          <p className="text-xs text-muted-foreground">Còn cần đặt / Tổng sản phẩm</p>
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 size={28} strokeWidth={1.2} className="mx-auto mb-2" />
          <p className="text-sm">
            {orders && orders.length > 0
              ? "Không có đơn Đã chuyển khoản mới"
              : "Chưa có đơn hàng nào"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(([name, { qty, revenue }]) => {
            const pct = totalItems > 0 ? (qty / totalItems) * 100 : 0;
            const isDone = orderedItems.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleOrdered(name)}
                className={`w-full text-left bg-card border rounded-2xl p-3 transition-all ${
                  isDone
                    ? "border-border/40 opacity-45 grayscale"
                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      isDone ? "bg-muted-foreground/40 border-muted-foreground/40" : "border-primary/40"
                    }`}>
                      {isDone && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <p className={`font-bold text-sm truncate pr-2 ${isDone ? "line-through" : ""}`}>{name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className={`text-xs font-black ${isDone ? "bg-muted text-muted-foreground border-muted" : "bg-primary/10 text-primary border-primary/20"}`}>
                      ×{qty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatPrice(revenue)}</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isDone ? "bg-muted-foreground/30" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== Members =====================

interface SheetOrder {
  timestamp: string; name: string; phone: string; memberStatus: string;
  address: string; products: string; totalPrice: string; shippingMethod: string; notes: string;
}

function MemberRecentOrders({ phone }: { phone: string }) {
  const [orders, setOrders] = useState<SheetOrder[]>([]);
  const [expanded, setExpanded] = useState(false);
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  useEffect(() => {
    if (!phone) return;
    fetch(`${base}/api/sheets/member-orders?phone=${encodeURIComponent(phone)}&_t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: SheetOrder[]) => { if (Array.isArray(data)) setOrders(data.slice().reverse()); })
      .catch(() => {});
  }, [phone]);

  if (orders.length === 0) return null;

  const shown = expanded ? orders : orders.slice(0, 2);

  return (
    <div className="mt-2 border-t border-border pt-2 space-y-1.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        Đơn gần nhất ({orders.length})
      </p>
      {shown.map((o, i) => (
        <div key={i} className="bg-muted/50 rounded-lg px-2 py-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">{o.timestamp ? new Date(o.timestamp).toLocaleDateString("vi-VN") : "—"}</span>
            {o.totalPrice && <span className="font-bold text-primary shrink-0">{o.totalPrice}</span>}
          </div>
          {o.products && <p className="text-foreground truncate mt-0.5">{o.products}</p>}
          {o.shippingMethod && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 inline-block mt-0.5">
              🚚 {o.shippingMethod}
            </span>
          )}
        </div>
      ))}
      {orders.length > 2 && (
        <button
          className="text-[10px] text-primary font-semibold hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Thu gọn" : `Xem thêm ${orders.length - 2} đơn`}
        </button>
      )}
    </div>
  );
}

interface MergedMember {
  key: string;
  name: string;
  phone: string;
  tier: string;
  points: number;
  customerCode?: string;
  address?: string;
  email?: string;
  notes?: string;
  joinedAt?: string;
  dbId?: number;
  fromSheets: boolean;
}

function MembersTab() {
  const addPoints = useAddPoints();
  const { data: dbMembers, refetch: refetchDb } = useListMembers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sheetMembers, setSheetMembers] = useState<any[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [search, setSearch] = useState("");
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const fetchSheets = () => {
    setSheetsLoading(true);
    fetch(`${base}/api/sheets/all-members?_t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const rows = Array.isArray(data) ? data.filter((m: any) => m.name || m.phone) : [];
        setSheetMembers(rows);
        setSheetsLoading(false);
      })
      .catch(() => { setSheetMembers([]); setSheetsLoading(false); });
  };

  useEffect(() => { fetchSheets(); }, []);

  const normalizePhone = (p: string) => (p ?? "").replace(/\D/g, "");

  // Merge: Sheets members as primary, fill in DB extras, append DB-only members
  const merged: MergedMember[] = useMemo(() => {
    const result: MergedMember[] = sheetMembers.map((s, idx) => {
      const db = dbMembers?.find((d) => normalizePhone(d.phone) === normalizePhone(s.phone));
      return {
        key: s.phone ? `sheet-${s.phone}` : `sheet-idx-${idx}`,
        name: s.name ?? "",
        phone: s.phone ?? "",
        tier: s.tier ?? "Newcomers",
        points: db?.points ?? s.points ?? 0,
        customerCode: s.customerCode,
        address: s.address,
        email: db?.email ?? undefined,
        notes: db?.notes ?? undefined,
        joinedAt: db?.joinedAt,
        dbId: db?.id,
        fromSheets: true,
      };
    });
    // Append DB-only members not in Sheets
    (dbMembers ?? []).forEach((d) => {
      const already = sheetMembers.some((s) => normalizePhone(s.phone) === normalizePhone(d.phone));
      if (!already) {
        result.push({
          key: `db-${d.id}`,
          name: d.name,
          phone: d.phone,
          tier: d.tier ?? "bronze",
          points: d.points ?? 0,
          email: d.email ?? undefined,
          notes: d.notes ?? undefined,
          joinedAt: d.joinedAt,
          dbId: d.id,
          fromSheets: false,
        });
      }
    });
    return result;
  }, [sheetMembers, dbMembers]);

  const filtered = merged.filter((m) =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search) ||
    (m.customerCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const tierEmoji = (tier: string) => {
    const t = (tier ?? "").toLowerCase();
    if (t.includes("dragon") || t.includes("phoenix") || t.includes("patron") || t.includes("vip") || t.includes("infinite") || t.includes("solstice")) return "👑";
    if (t.includes("platinum") || t.includes("ruby")) return "💎";
    if (t.includes("gold")) return "🥇";
    if (t.includes("silver")) return "🥈";
    if (t.includes("bronze")) return "🥉";
    return "🌟";
  };

  const tierColor = (tier: string) => {
    const t = (tier ?? "").toLowerCase();
    if (t.includes("gold") || t.includes("vip") || t.includes("patron") || t.includes("dragon") || t.includes("phoenix")) return "bg-amber-100 text-amber-800";
    if (t.includes("platinum") || t.includes("ruby") || t.includes("infinite") || t.includes("solstice")) return "bg-purple-100 text-purple-800";
    if (t.includes("silver")) return "bg-slate-100 text-slate-700";
    if (t.includes("bronze")) return "bg-orange-100 text-orange-700";
    return "bg-blue-50 text-blue-700";
  };

  const handleAddPoints = () => {
    if (!selectedKey || !pointsAmount) return;
    const member = merged.find((m) => m.key === selectedKey);
    if (!member?.dbId) {
      toast({ title: "Thành viên này chưa có tài khoản trong hệ thống", variant: "destructive" });
      return;
    }
    addPoints.mutate({ id: member.dbId, data: { points: parseInt(pointsAmount), reason: null } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
        refetchDb();
        setPointsOpen(false);
        setPointsAmount("");
        toast({ title: "Đã thêm điểm" });
      },
    });
  };

  const selectedMember = merged.find((m) => m.key === selectedKey);
  const isLoading = sheetsLoading;

  const handleRefresh = () => { fetchSheets(); refetchDb(); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Thành Viên ({filtered.length})</h3>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={handleRefresh}>
          Làm mới
        </Button>
      </div>

      <Input
        placeholder="Tìm theo tên, SĐT, mã KH..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-xl"
        data-testid="input-member-search"
      />

      <Dialog open={pointsOpen} onOpenChange={setPointsOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Thêm điểm thủ công</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm font-semibold">{selectedMember?.name}</p>
            <p className="text-xs text-muted-foreground">Điểm hiện tại: {(selectedMember?.points ?? 0).toLocaleString()} pts</p>
            <div><Label>Số điểm</Label><Input type="number" value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)} className="rounded-xl mt-1" data-testid="input-points-amount" /></div>
            <Button className="w-full rounded-xl" onClick={handleAddPoints} data-testid="button-save-points">Thêm điểm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {search ? "Không tìm thấy thành viên phù hợp" : "Chưa có thành viên nào"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.key} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3" data-testid={`admin-member-${m.customerCode ?? m.key}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-base text-white"
                style={{ background: "linear-gradient(135deg, #e879a8 0%, #a855f7 100%)" }}>
                {(m.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm truncate">{m.name}</p>
                  <span className="text-[11px]">{tierEmoji(m.tier)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tierColor(m.tier)}`}>{m.tier}</span>
                  {m.customerCode && <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-semibold">{m.customerCode}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{m.phone}</p>
                {m.address && <p className="text-[11px] text-muted-foreground truncate">📍 {m.address}</p>}
                {m.email && <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>}
                {m.notes && <p className="text-[11px] text-muted-foreground truncate">📝 {m.notes}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-500" />
                    <span className="text-xs font-bold text-amber-600">{(m.points ?? 0).toLocaleString()} pts</span>
                  </div>
                  {m.joinedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Tham gia {new Date(m.joinedAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
                {m.phone && <MemberRecentOrders phone={m.phone} />}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl text-xs"
                onClick={() => { setSelectedKey(m.key); setPointsOpen(true); }}
                data-testid={`button-add-points-${m.customerCode ?? m.key}`}
              >
                + Điểm
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== Rewards =====================
function RewardsTab() {
  const { data: rewards } = useListRewards();
  const createReward = useCreateReward();
  const deleteReward = useDeleteReward();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", pointsCost: "", stock: "10", imageUrl: "" });

  const resetForm = () => setForm({ name: "", description: "", pointsCost: "", stock: "10", imageUrl: "" });

  const handleCreate = () => {
    if (!form.name || !form.pointsCost) { toast({ title: "Nhập đủ thông tin", variant: "destructive" }); return; }
    createReward.mutate({ data: { name: form.name, description: form.description || null, pointsCost: parseInt(form.pointsCost), stock: parseInt(form.stock), isAvailable: true, imageUrl: form.imageUrl || null } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() }); setOpen(false); resetForm(); toast({ title: "Đã thêm quà tặng" }); },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Quà Tặng ({rewards?.length ?? 0})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setOpen(true); }}>
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Thêm quà tặng</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Tên quà *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" /></div>
            <div><Label>Mô tả</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Điểm đổi *</Label><Input type="number" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label>Số lượng</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl mt-1" /></div>
            </div>
            <Button className="w-full rounded-xl" onClick={handleCreate}>Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {rewards?.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Gift size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{r.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-amber-600">{r.pointsCost.toLocaleString()} pts</span>
                <span className="text-xs text-muted-foreground">Còn: {r.stock}</span>
                {!r.isAvailable && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">Tắt</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive shrink-0" onClick={() => deleteReward.mutate({ id: r.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() }) })}>
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Main Admin =====================
const tabs = [
  { id: "dashboard", label: "Tổng quan", icon: BarChart3 },
  { id: "products", label: "Sản phẩm", icon: Package },
  { id: "orders", label: "Đơn hàng", icon: ShoppingBag },
  { id: "stats", label: "Thống kê", icon: TrendingUp },
  { id: "shipping", label: "Vận chuyển", icon: Truck },
  { id: "preorder", label: "Pre-order", icon: Calendar },
  { id: "members", label: "Thành viên", icon: Users },
  { id: "rewards", label: "Quà tặng", icon: Gift },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("admin_authenticated") === "true");
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogin = () => {
    localStorage.setItem("admin_authenticated", "true");
    setAuthed(true);
  };
  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    setAuthed(false);
  };

  if (!authed) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-10 pb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-xs opacity-70">Quản lý toàn bộ hệ thống</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut size={13} />
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pt-3 pb-1 hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`admin-tab-${id}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "shipping" && <ShippingTab />}
        {activeTab === "preorder" && <PreorderTab />}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "rewards" && <RewardsTab />}
      </div>
    </div>
  );
}
