import { useState, useEffect, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  TrendingUp, Star, Calendar, X, Check, BarChart3, Sparkles, Bell, Pin, Ticket, Eye, EyeOff, Tag,
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

const shippingStatusOptions = ["web_order", "warehouse_origin", "shipping_to_vn", "warehouse_vn", "sorting", "preparing", "in_transit", "delivered", "returned"];
const shippingStatusLabels: Record<string, string> = {
  web_order: "Web trả hàng",
  warehouse_origin: "Đã về kho tại nước sở tại",
  shipping_to_vn: "Đang giao về kho Việt",
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
                    <SelectItem value="prestock">Hàng đặt trước</SelectItem>
                    <SelectItem value="awaitingstock">Awaiting Stock</SelectItem>
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
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type ReturnedStatus =
  | { kind: "pending"; label: string }
  | { kind: "due" }
  | { kind: "hidden" };

function getReturnedStatus(returnedAt: string | Date | null | undefined): ReturnedStatus | null {
  if (!returnedAt) return null;
  const elapsed = Date.now() - new Date(returnedAt).getTime();
  if (elapsed >= TWO_WEEKS_MS) return { kind: "hidden" };
  if (elapsed >= ONE_WEEK_MS) return { kind: "due" };
  const remaining = TWO_WEEKS_MS - elapsed;
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return { kind: "pending", label: `Tự ẩn sau ${days} ngày` };
}

function ShippingTab() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const { data: updates, refetch } = useQuery({
    queryKey: ["/api/shipping?all=true"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/shipping?all=true`, { cache: "no-store" });
      if (!res.ok) return [];
      return res.json() as Promise<Array<{ id: number; title: string; description: string; status: string; estimatedDate: string | null; returnedAt: string | null; createdAt: string }>>;
    },
  });
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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() });
    refetch();
  };

  const handleSave = () => {
    if (!form.title || !form.description) { toast({ title: "Nhập đủ thông tin", variant: "destructive" }); return; }
    const data = { title: form.title, description: form.description, status: form.status, estimatedDate: form.estimatedDate || null };
    if (editId) {
      updateUpdate.mutate({ id: editId, data }, { onSuccess: () => { invalidate(); setOpen(false); resetForm(); setEditId(null); toast({ title: "Đã cập nhật" }); } });
    } else {
      createUpdate.mutate({ data }, { onSuccess: () => { invalidate(); setOpen(false); resetForm(); toast({ title: "Đã thêm cập nhật vận chuyển" }); } });
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
        {updates && [...updates].reverse().map((u) => {
          const rs = u.status === "returned" ? getReturnedStatus(u.returnedAt) : null;
          const isHidden = rs?.kind === "hidden";
          const isDue = rs?.kind === "due";
          return (
            <div
              key={u.id}
              className={`bg-card border rounded-2xl p-3 flex items-start gap-3 transition-colors ${
                isDue
                  ? "border-destructive/50 ring-1 ring-destructive/20 bg-destructive/5"
                  : isHidden
                  ? "border-dashed border-muted-foreground/30 opacity-50"
                  : "border-border"
              }`}
              data-testid={`admin-shipping-${u.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{u.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge variant="outline" className="text-[10px] rounded-full">{shippingStatusLabels[u.status] ?? u.status}</Badge>
                  {rs?.kind === "pending" && (
                    <Badge variant="outline" className="text-[10px] rounded-full border-amber-300 text-amber-700 bg-amber-50">
                      ⏱ {rs.label}
                    </Badge>
                  )}
                  {isDue && (
                    <Badge className="text-[10px] rounded-full bg-destructive/10 text-destructive border border-destructive/30 font-bold">
                      🗑️ Đến hạn xoá
                    </Badge>
                  )}
                  {isHidden && (
                    <Badge variant="outline" className="text-[10px] rounded-full border-muted-foreground/30 text-muted-foreground">
                      Đã ẩn khỏi trang công khai
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(u)}><Pencil size={13} /></Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-xl ${isDue ? "text-destructive" : "text-destructive"}`} onClick={() => deleteUpdate.mutate({ id: u.id }, { onSuccess: () => invalidate() })}><Trash2 size={13} /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== Pre-order Schedule =====================
interface PreorderItem {
  id: number; title: string; description: string | null; startDate: string | null; deadline: string | null; pickupDate: string | null; pickupDeadline: string | null;
  scheduleType: string | null; imageUrl: string | null; artist: string | null; isActive: boolean; createdAt: string;
}

function PreorderTab() {
  const [items, setItems] = useState<PreorderItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"po" | "pickup" | "booking">("po");
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
    const type = item.scheduleType ?? (item.pickupDeadline ? "pickup" : "po");
    setScheduleMode(type as "po" | "pickup" | "booking");
    setForm({ title: item.title, description: item.description ?? "", startDate: item.startDate ?? "", deadline: item.deadline ?? "", pickupDate: item.pickupDate ?? "", pickupDeadline: item.pickupDeadline ?? "", artist: item.artist ?? "", imageUrl: item.imageUrl ?? "", isActive: item.isActive });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast({ title: "Nhập tiêu đề", variant: "destructive" }); return; }
    const body = {
      title: form.title,
      description: form.description || null,
      startDate: form.startDate || null,
      deadline: (scheduleMode === "po" || scheduleMode === "booking") ? (form.deadline || null) : null,
      pickupDate: scheduleMode === "pickup" ? (form.pickupDate || null) : null,
      pickupDeadline: scheduleMode === "pickup" ? (form.pickupDeadline || null) : null,
      scheduleType: scheduleMode,
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
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${scheduleMode === "po" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  📅 Deadline đặt hàng
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("pickup")}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${scheduleMode === "pickup" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  🛍️ Lịch đi mua tại store
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("booking")}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${scheduleMode === "booking" ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  🎫 Nhận Booking Vé
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{scheduleMode === "pickup" ? "Bắt đầu đi pickup" : scheduleMode === "booking" ? "Ngày mở booking" : "Bắt đầu PO"}</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl mt-1" />
              </div>
              {scheduleMode === "po" && (
                <div><Label>Deadline PO</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-xl mt-1" /></div>
              )}
              {scheduleMode === "pickup" && (
                <div><Label className="text-emerald-700 dark:text-emerald-400">Deadline pickup</Label><Input type="date" value={form.pickupDeadline} onChange={(e) => setForm({ ...form, pickupDeadline: e.target.value })} className="rounded-xl mt-1" /></div>
              )}
              {scheduleMode === "booking" && (
                <div><Label className="text-violet-700 dark:text-violet-400">Deadline booking</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-xl mt-1" /></div>
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
        {items.map((item) => {
          const today = new Date().toISOString().slice(0, 10);
          const effectiveDeadline = item.pickupDeadline ?? item.deadline;
          const isExpired = !!effectiveDeadline && effectiveDeadline < today;
          const isDim = isExpired || !item.isActive;
          const type = item.scheduleType ?? (item.pickupDeadline ? "pickup" : "po");
          const typeConfig = {
            po:      { icon: "📅", color: "text-primary",       bg: "bg-primary/10"    },
            pickup:  { icon: "🛍️", color: "text-emerald-600",  bg: "bg-emerald-50"    },
            booking: { icon: "🎫", color: "text-violet-600",    bg: "bg-violet-50"     },
          }[type] ?? { icon: "📅", color: "text-primary", bg: "bg-primary/10" };
          return (
            <div key={item.id} className={`bg-card border rounded-2xl p-3 flex items-start gap-3 transition-opacity ${isDim ? "opacity-40 border-dashed" : "border-border"}`} data-testid={`admin-preorder-${item.id}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base ${isExpired ? "bg-muted" : typeConfig.bg}`}>
                {typeConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{item.title}</p>
                {item.artist && <p className={`text-xs font-semibold mt-0.5 ${isExpired ? "text-muted-foreground" : typeConfig.color}`}>{item.artist}</p>}
                <div className="flex flex-wrap gap-x-3 mt-0.5">
                  {type === "pickup" && item.pickupDeadline && (
                    <p className="text-xs text-emerald-600 font-medium">🛍️ Pickup{item.startDate ? `: ${item.startDate}` : ""} · deadline {item.pickupDeadline}</p>
                  )}
                  {type === "booking" && (
                    <p className="text-xs text-violet-600 font-medium">🎫 Nhận booking{item.startDate ? `: ${item.startDate}` : ""}{ item.deadline ? ` · deadline ${item.deadline}` : ""}</p>
                  )}
                  {type === "po" && (
                    <>
                      {item.startDate && <p className="text-xs text-muted-foreground">Bắt đầu: {item.startDate}</p>}
                      {item.deadline && <p className="text-xs text-muted-foreground">Deadline: {item.deadline}</p>}
                    </>
                  )}
                </div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {!item.isActive && <Badge variant="secondary" className="text-[10px]">Đã đóng</Badge>}
                  {isExpired && <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">⏰ Đã hết deadline</Badge>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(item)}><Pencil size={13} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={13} /></Button>
              </div>
            </div>
          );
        })}
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

// ===================== Notices Tab =====================
type NoticeItem = { id: number; title: string; content: string; type: string; isPinned: boolean; seller: string | null; soldNotes: string | null; createdAt: string };

function NoticesTab() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editNoticeId, setEditNoticeId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "general", isPinned: false, sellerType: "shop", sellerCode: "", soldNotes: "" });
  const { toast } = useToast();

  function getBaseUrl() { const b = import.meta.env.BASE_URL ?? "/"; return b.replace(/\/$/, ""); }

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/notices`, { cache: "no-store" });
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const buildSeller = () => {
    if (form.type !== "ticket") return null;
    if (form.sellerType === "shop") return "shop";
    if (form.sellerType === "member") return form.sellerCode.trim() ? `member:${form.sellerCode.trim()}` : "member";
    return "external";
  };

  const resetForm = () => {
    setForm({ title: "", content: "", type: "general", isPinned: false, sellerType: "shop", sellerCode: "", soldNotes: "" });
    setEditNoticeId(null);
  };

  const openEditNotice = (n: NoticeItem) => {
    let sellerType = "shop";
    let sellerCode = "";
    if (n.seller === "external") sellerType = "external";
    else if (n.seller === "shop" || !n.seller) sellerType = "shop";
    else if (n.seller.startsWith("member:")) { sellerType = "member"; sellerCode = n.seller.replace("member:", ""); }
    else if (n.seller === "member") sellerType = "member";
    setForm({ title: n.title, content: n.content, type: n.type, isPinned: n.isPinned, sellerType, sellerCode, soldNotes: n.soldNotes ?? "" });
    setEditNoticeId(n.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast({ title: "Vui lòng nhập tiêu đề và nội dung", variant: "destructive" }); return; }
    try {
      const payload = { title: form.title, content: form.content, type: form.type, isPinned: form.isPinned, seller: buildSeller(), soldNotes: form.type === "ticket" ? (form.soldNotes.trim() || null) : null };
      const url = editNoticeId ? `${getBaseUrl()}/api/notices/${editNoticeId}` : `${getBaseUrl()}/api/notices`;
      const method = editNoticeId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast({ title: editNoticeId ? "Đã cập nhật thông báo" : "Đã đăng thông báo" });
      setOpen(false);
      resetForm();
      load();
    } catch { toast({ title: "Lỗi khi lưu thông báo", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${getBaseUrl()}/api/notices/${id}`, { method: "DELETE" });
      toast({ title: "Đã xoá thông báo" });
      load();
    } catch { toast({ title: "Lỗi khi xoá", variant: "destructive" }); }
  };

  const handleTogglePin = async (n: NoticeItem) => {
    try {
      await fetch(`${getBaseUrl()}/api/notices/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !n.isPinned }),
      });
      load();
    } catch { /* ignore */ }
  };

  const typeLabel: Record<string, string> = { general: "Thông báo", looking: "Tìm khách", ticket: "Vé dư concert" };
  const typeBg: Record<string, string> = { general: "bg-primary/10 text-primary", looking: "bg-rose-100 text-rose-600", ticket: "bg-fuchsia-100 text-fuchsia-700" };

  const sellerLabel = (seller: string | null) => {
    if (!seller) return null;
    if (seller === "shop") return { icon: "🏪", text: "Tiệm Chu Du" };
    if (seller === "external") return { icon: "🧑", text: "Khách ngoài" };
    if (seller.startsWith("member:")) return { icon: "👤", text: seller.replace("member:", "") };
    if (seller === "member") return { icon: "👤", text: "Thành viên" };
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><Bell size={15} className="text-primary" />Thông báo ({notices.length})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setOpen(true); }}>
          <Plus size={14} className="mr-1" />Đăng thông báo
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editNoticeId ? "Chỉnh sửa thông báo" : "Đăng thông báo mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Loại thông báo</Label>
              <div className="flex gap-2 mt-1">
                {[{ value: "general", label: "📣 Thông báo chung" }, { value: "looking", label: "🔍 Tìm khách" }, { value: "ticket", label: "🎟️ Vé dư concert" }].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${form.type === t.value ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"}`}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            {form.type === "ticket" && (
              <div>
                <Label>Người bán vé</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {[{ v: "shop", icon: "🏪", label: "Tiệm Chu Du" }, { v: "member", icon: "👤", label: "Thành viên" }, { v: "external", icon: "🧑", label: "Khách ngoài" }].map((s) => (
                    <button key={s.v} type="button" onClick={() => setForm({ ...form, sellerType: s.v })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.sellerType === s.v ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"}`}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
                {form.sellerType === "member" && (
                  <Input value={form.sellerCode} onChange={(e) => setForm({ ...form, sellerCode: e.target.value })} placeholder="Mã thành viên (VD: MS001)" className="rounded-xl mt-2" />
                )}
              </div>
            )}
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Thông báo lô hàng, Tìm chủ đơn 0912..." className="rounded-xl mt-1" /></div>
            <div><Label>Nội dung *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Nhập nội dung thông báo..." className="rounded-xl mt-1" /></div>
            {form.type === "ticket" && (
              <div>
                <Label className="flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-500" />
                  Ghi chú đã bán
                  <span className="text-[10px] text-muted-foreground font-normal">(mỗi dòng 1 vé)</span>
                </Label>
                <Textarea value={form.soldNotes} onChange={(e) => setForm({ ...form, soldNotes: e.target.value })} rows={3} placeholder={"Zone 7900: A2Bxx - 2 vé\nZone 4500: 1 vé"} className="rounded-xl mt-1 font-mono text-xs" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pin" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="rounded" />
              <Label htmlFor="pin" className="cursor-pointer">Ghim thông báo lên đầu</Label>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSave}>{editNoticeId ? "Lưu thay đổi" : "Đăng"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading && <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}</div>}

      {!loading && notices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bell size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có thông báo nào</p>
        </div>
      )}

      <div className="space-y-2">
        {notices.map((n) => (
          <div key={n.id} className={`bg-card border rounded-2xl p-4 ${n.isPinned ? "border-primary/30 ring-1 ring-primary/20" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {n.isPinned && <Pin size={11} className="text-primary shrink-0" />}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBg[n.type] ?? "bg-muted text-muted-foreground"}`}>{typeLabel[n.type] ?? n.type}</span>
                  {n.seller && (() => { const sl = sellerLabel(n.seller); return sl ? <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{sl.icon} {sl.text}</span> : null; })()}
                  <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <p className="font-bold text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                {n.soldNotes && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {n.soldNotes.split("\n").filter(Boolean).map((line, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-lg line-through opacity-70">
                        <Check size={9} className="shrink-0 no-underline" style={{ textDecoration: "none" }} />
                        <span>{line}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-xl ${n.isPinned ? "text-primary" : "text-muted-foreground"}`} onClick={() => handleTogglePin(n)} title={n.isPinned ? "Bỏ ghim" : "Ghim"}>
                  <Pin size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground" onClick={() => openEditNotice(n)} title="Chỉnh sửa">
                  <Pencil size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => handleDelete(n.id)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Booking Tab =====================
type AssignedMember = { name: string; phone: string; customerCode: string };
type BookingNote = { id: number; title: string; content: string; event: string | null; eventDate: string | null; price: string | null; deadline: string | null; status: string; assignedTo: AssignedMember[] | null; createdAt: string };

function BookingTab() {
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BookingNote | null>(null);
  const [form, setForm] = useState({ title: "", content: "", event: "", eventDate: "", price: "", deadline: "" });
  const [assignedTo, setAssignedTo] = useState<AssignedMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [allSheetMembers, setAllSheetMembers] = useState<AssignedMember[]>([]);
  const { toast } = useToast();

  function getBaseUrl() { const b = import.meta.env.BASE_URL ?? "/"; return b.replace(/\/$/, ""); }

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/booking-notes?all=true`, { cache: "no-store" });
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch { /**/ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/sheets/all-members?_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setAllSheetMembers(data.filter((m) => m.name && m.phone).map((m) => ({
            name: m.name ?? "",
            phone: m.phone ?? "",
            customerCode: m.customerCode ?? "",
          })));
        }
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: "", content: "", event: "", eventDate: "", price: "", deadline: "" });
    setAssignedTo([]);
    setMemberSearch("");
    setOpen(true);
  };
  const openEdit = (n: BookingNote) => {
    setEditTarget(n);
    setForm({ title: n.title, content: n.content, event: n.event ?? "", eventDate: n.eventDate ?? "", price: n.price ?? "", deadline: n.deadline ?? "" });
    setAssignedTo(n.assignedTo ?? []);
    setMemberSearch("");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast({ title: "Vui lòng nhập tiêu đề và nội dung", variant: "destructive" }); return; }
    try {
      const url = editTarget ? `${getBaseUrl()}/api/booking-notes/${editTarget.id}` : `${getBaseUrl()}/api/booking-notes`;
      const res = await fetch(url, { method: editTarget ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, assignedTo }) });
      if (!res.ok) throw new Error();
      toast({ title: editTarget ? "Đã cập nhật note" : "Đã tạo note booking" });
      setOpen(false);
      load();
    } catch { toast({ title: "Lỗi khi lưu", variant: "destructive" }); }
  };

  const handleTogglePublish = async (n: BookingNote) => {
    const next = n.status === "published" ? "draft" : "published";
    try {
      await fetch(`${getBaseUrl()}/api/booking-notes/${n.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      toast({ title: next === "published" ? "✅ Đã pin lên trang thành viên" : "📝 Đã chuyển về nháp" });
      load();
    } catch { toast({ title: "Lỗi", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${getBaseUrl()}/api/booking-notes/${id}`, { method: "DELETE" });
      toast({ title: "Đã xoá note" });
      load();
    } catch { toast({ title: "Lỗi khi xoá", variant: "destructive" }); }
  };

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const memberResults = memberSearch.trim().length >= 1
    ? allSheetMembers.filter((m) =>
        !assignedTo.some((a) => a.phone === m.phone) &&
        (norm(m.name).includes(norm(memberSearch)) || m.phone.includes(memberSearch) || m.customerCode.toLowerCase().includes(memberSearch.toLowerCase()))
      ).slice(0, 6)
    : [];

  const addMember = (m: AssignedMember) => { setAssignedTo((prev) => [...prev, m]); setMemberSearch(""); };
  const removeMember = (phone: string) => setAssignedTo((prev) => prev.filter((a) => a.phone !== phone));

  const published = notes.filter((n) => n.status === "published");
  const drafts = notes.filter((n) => n.status === "draft");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><Ticket size={15} className="text-primary" />Booking Vé ({notes.length})</h3>
        <Button size="sm" className="rounded-xl" onClick={openCreate}>
          <Plus size={14} className="mr-1" />Tạo note mới
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-emerald-600">{published.length}</p>
          <p className="text-[10px] text-emerald-700 font-semibold">Đang hiển thị</p>
        </div>
        <div className="bg-muted border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-black text-muted-foreground">{drafts.length}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Bản nháp</p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editTarget ? "Chỉnh sửa note booking" : "Tạo note booking mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Booking vé concert IVE tháng 6" className="rounded-xl mt-1" /></div>
            <div><Label>Nội dung *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Mô tả chi tiết về booking vé, hướng dẫn, lưu ý..." className="rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Sự kiện</Label><Input value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} placeholder="VD: IVE Concert" className="rounded-xl mt-1" /></div>
              <div><Label>Ngày sự kiện</Label><Input value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} placeholder="VD: 15/06/2026" className="rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Giá vé</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="VD: 1.500.000đ" className="rounded-xl mt-1" /></div>
              <div><Label>Deadline booking</Label><Input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="VD: 20/05/2026" className="rounded-xl mt-1" /></div>
            </div>

            {/* Member assignment */}
            <div>
              <Label>Gán cho thành viên</Label>
              <p className="text-[10px] text-muted-foreground mb-1.5">Để trống = hiển thị cho tất cả thành viên. Gán tên = chỉ thành viên đó thấy.</p>
              <div className="relative">
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Tìm tên, SĐT, hoặc mã thành viên..."
                  className="rounded-xl"
                />
                {memberResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {memberResults.map((m) => (
                      <button key={m.phone} type="button" className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2" onClick={() => addMember(m)}>
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{m.name[0]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.phone} · {m.customerCode}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {assignedTo.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {assignedTo.map((m) => (
                    <span key={m.phone} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                      {m.name}
                      <button type="button" onClick={() => removeMember(m.phone)} className="text-primary/60 hover:text-destructive ml-0.5"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full rounded-xl" onClick={handleSave}>{editTarget ? "Lưu thay đổi" : "Tạo note (bản nháp)"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading && <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />)}</div>}

      {!loading && notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Ticket size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có note booking nào</p>
        </div>
      )}

      <div className="space-y-2">
        {notes.map((n) => {
          const members = n.assignedTo ?? [];
          return (
            <div key={n.id} className={`bg-card border rounded-2xl p-4 ${n.status === "published" ? "border-emerald-300 ring-1 ring-emerald-200" : "border-border"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {n.status === "published" ? "✅ Đang hiển thị" : "📝 Bản nháp"}
                    </span>
                    {members.length > 0
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">👤 {members.length} thành viên</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">🌐 Công khai</span>
                    }
                    <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <p className="font-bold text-sm">{n.title}</p>
                  {(n.event || n.eventDate) && (
                    <p className="text-xs text-primary font-semibold mt-0.5">🎫 {[n.event, n.eventDate].filter(Boolean).join(" · ")}</p>
                  )}
                  {(n.price || n.deadline) && (
                    <div className="flex gap-3 mt-1">
                      {n.price && <span className="text-[11px] text-muted-foreground">💰 {n.price}</span>}
                      {n.deadline && <span className="text-[11px] text-muted-foreground">⏰ Hết hạn: {n.deadline}</span>}
                    </div>
                  )}
                  {members.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {members.map((m) => (
                        <span key={m.phone} className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-full font-semibold">{m.name}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{n.content}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon"
                    className={`h-8 w-8 rounded-xl ${n.status === "published" ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground"}`}
                    onClick={() => handleTogglePublish(n)}
                    title={n.status === "published" ? "Bỏ hiển thị" : "Pin lên trang thành viên"}
                  >
                    {n.status === "published" ? <EyeOff size={13} /> : <Eye size={13} />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground" onClick={() => openEdit(n)} title="Chỉnh sửa">
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => handleDelete(n.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== Coupon Tab =====================
const TIERS: { value: string; label: string; emoji: string }[] = [
  { value: "Newcomers",      label: "Newcomers",       emoji: "🌸" },
  { value: "Friend of Store",label: "Friend of Store", emoji: "🌿" },
  { value: "Muses",          label: "Muses",           emoji: "🔮" },
  { value: "Dreamer",        label: "Dreamer",         emoji: "💙" },
  { value: "Ruby",           label: "Ruby",            emoji: "🥂" },
  { value: "Platinum",       label: "Platinum",        emoji: "💎" },
  { value: "Priviledged",    label: "Priviledged",     emoji: "🖤" },
  { value: "Infinite",       label: "Infinite",        emoji: "🐉" },
  { value: "Solstice",       label: "Solstice",        emoji: "🐲" },
  { value: "Patron",         label: "Patron",          emoji: "🦅" },
  { value: "Voyager",        label: "Voyager",         emoji: "🦚" },
];
const DISCOUNT_TYPES: Record<string, string> = {
  fixed: "Giảm tiền cố định",
  percentage: "Giảm theo %",
  gift: "Tặng quà",
  freeship: "Miễn phí ship",
};

type CouponMember = { name: string; phone: string; customerCode: string };
type CouponItem = {
  id: number; code: string; title: string; description: string | null;
  discountType: string; discountValue: string | null;
  eligibleTiers: string[]; assignedMembers: CouponMember[];
  expiresAt: string | null; isActive: boolean; isUsed: boolean; usedAt: string | null; createdAt: string;
};

function CouponTab() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CouponItem | null>(null);
  const [form, setForm] = useState({ code: "", title: "", description: "", discountType: "fixed", discountValue: "", expiresAt: "", isActive: true });
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<CouponMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [allSheetMembers, setAllSheetMembers] = useState<CouponMember[]>([]);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/coupons?all=true`, { cache: "no-store" });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch { /**/ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch(`${base}/api/sheets/all-members?_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setAllSheetMembers(data.filter((m) => m.name && m.phone).map((m) => ({
            name: m.name ?? "", phone: m.phone ?? "", customerCode: m.customerCode ?? "",
          })));
        }
      }).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({ code: "", title: "", description: "", discountType: "fixed", discountValue: "", expiresAt: "", isActive: true });
    setSelectedTiers([]); setAssignedMembers([]); setMemberSearch(""); setEditTarget(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (c: CouponItem) => {
    setEditTarget(c);
    setForm({ code: c.code, title: c.title, description: c.description ?? "", discountType: c.discountType, discountValue: c.discountValue ?? "", expiresAt: c.expiresAt ?? "", isActive: c.isActive });
    setSelectedTiers(c.eligibleTiers ?? []);
    setAssignedMembers(c.assignedMembers ?? []);
    setMemberSearch(""); setOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.title.trim()) { toast({ title: "Vui lòng nhập mã và tiêu đề", variant: "destructive" }); return; }
    try {
      const url = editTarget ? `${base}/api/coupons/${editTarget.id}` : `${base}/api/coupons`;
      const res = await fetch(url, {
        method: editTarget ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eligibleTiers: selectedTiers, assignedMembers }),
      });
      if (!res.ok) throw new Error();
      toast({ title: editTarget ? "Đã cập nhật coupon" : "Đã tạo coupon mới" });
      setOpen(false); resetForm(); load();
    } catch { toast({ title: "Lỗi khi lưu", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${base}/api/coupons/${id}`, { method: "DELETE" });
    toast({ title: "Đã xoá coupon" }); load();
  };

  const handleMarkUsed = async (id: number, currentUsed: boolean) => {
    await fetch(`${base}/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isUsed: !currentUsed, usedAt: !currentUsed ? new Date().toISOString() : null }),
    });
    toast({ title: !currentUsed ? "Đã đánh dấu đã sử dụng" : "Đã khôi phục coupon" });
    load();
  };

  const toggleTier = (v: string) => setSelectedTiers((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const memberResults = memberSearch.trim().length >= 1
    ? allSheetMembers.filter((m) =>
        !assignedMembers.some((a) => a.phone === m.phone) &&
        (norm(m.name).includes(norm(memberSearch)) || m.phone.includes(memberSearch) || m.customerCode.toLowerCase().includes(memberSearch.toLowerCase()))
      ).slice(0, 6)
    : [];

  const addMember = (m: CouponMember) => { setAssignedMembers((prev) => [...prev, m]); setMemberSearch(""); };
  const removeMember = (phone: string) => setAssignedMembers((prev) => prev.filter((a) => a.phone !== phone));

  const getDiscountLabel = (c: CouponItem) => {
    if (!c.discountValue) return DISCOUNT_TYPES[c.discountType] ?? c.discountType;
    if (c.discountType === "percentage") return `Giảm ${c.discountValue}%`;
    if (c.discountType === "fixed") return `Giảm ${Number(c.discountValue).toLocaleString("vi-VN")}đ`;
    if (c.discountType === "freeship") return "Miễn phí ship";
    return c.discountValue;
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><Tag size={15} className="text-primary" />Coupon ({coupons.length})</h3>
        <Button size="sm" className="rounded-xl" onClick={openCreate}><Plus size={14} className="mr-1" />Tạo coupon</Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editTarget ? "Chỉnh sửa coupon" : "Tạo coupon mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Mã coupon *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="rounded-xl mt-1 font-mono tracking-widest" />
              </div>
              <div>
                <Label>Hết hạn</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="rounded-xl mt-1" />
              </div>
            </div>
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Giảm 50k đơn hàng đầu tiên" className="rounded-xl mt-1" /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Điều kiện áp dụng..." className="rounded-xl mt-1" /></div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Loại ưu đãi</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISCOUNT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{form.discountType === "percentage" ? "Số % giảm" : form.discountType === "fixed" ? "Số tiền giảm (đ)" : "Giá trị"}</Label>
                <Input value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === "percentage" ? "10" : "50000"} className="rounded-xl mt-1" disabled={form.discountType === "freeship"} />
              </div>
            </div>

            <div>
              <Label>Áp dụng cho hạng thành viên</Label>
              <p className="text-[10px] text-muted-foreground mb-2">Để trống = tất cả hạng. Chọn hạng cụ thể = chỉ hạng đó nhận.</p>
              <div className="flex gap-2 flex-wrap">
                {TIERS.map((t) => (
                  <button key={t.value} type="button" onClick={() => toggleTier(t.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      selectedTiers.includes(t.value) ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Hoặc gán riêng cho thành viên cụ thể</Label>
              <p className="text-[10px] text-muted-foreground mb-1.5">Nếu gán tên, coupon chỉ hiện cho thành viên đó (ưu tiên hơn hạng).</p>
              <div className="relative">
                <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Tìm tên, SĐT, mã thành viên..." className="rounded-xl" />
                {memberResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {memberResults.map((m) => (
                      <button key={m.phone} type="button" className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2" onClick={() => addMember(m)}>
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{m.name[0]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.phone} · {m.customerCode}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {assignedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {assignedMembers.map((m) => (
                    <span key={m.phone} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                      {m.name}<button type="button" onClick={() => removeMember(m.phone)} className="text-primary/60 hover:text-destructive ml-0.5"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 py-1">
              <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-muted"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <Label className="cursor-pointer" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                {form.isActive ? "Đang kích hoạt" : "Tắt"}
              </Label>
            </div>

            <Button className="w-full rounded-xl" onClick={handleSave}>{editTarget ? "Lưu thay đổi" : "Tạo coupon"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}</div>}

      {!loading && coupons.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Tag size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có coupon nào</p>
        </div>
      )}

      <div className="space-y-2">
        {[...coupons].reverse().map((c) => {
          const isExpired = !!c.expiresAt && c.expiresAt < today;
          const isUsed = !!c.isUsed;
          const members = c.assignedMembers ?? [];
          const tiers = c.eligibleTiers ?? [];
          const dimmed = !c.isActive || isExpired || isUsed;
          return (
            <div key={c.id} className={`bg-card border rounded-2xl p-4 transition-all ${dimmed ? "opacity-50 border-dashed" : "border-border"} ${isUsed ? "grayscale" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`font-mono font-black text-sm tracking-widest px-2 py-0.5 rounded-lg ${isUsed ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{c.code}</span>
                    {isUsed && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">✓ Đã sử dụng</span>}
                    {!c.isActive && !isUsed && <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Tắt</span>}
                    {isExpired && !isUsed && <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">⏰ Hết hạn</span>}
                  </div>
                  <p className="font-bold text-sm">{c.title}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${isUsed ? "text-muted-foreground" : "text-primary"}`}>💰 {getDiscountLabel(c)}</p>
                  {c.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {members.length > 0
                      ? members.map((m) => <span key={m.phone} className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-full font-semibold">👤 {m.name}</span>)
                      : tiers.length > 0
                        ? tiers.map((t) => {
                            const cfg = TIERS.find((x) => x.value.toLowerCase() === t.toLowerCase());
                            return (
                              <span key={t} className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-full font-semibold">
                                {cfg?.emoji ?? "⭐"} {t}
                              </span>
                            );
                          })
                        : <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">🌐 Tất cả hạng</span>
                    }
                    {c.expiresAt && !isExpired && !isUsed && <span className="text-[10px] text-muted-foreground">· HSD: {c.expiresAt}</span>}
                    {isUsed && c.usedAt && (
                      <span className="text-[10px] text-muted-foreground">· Dùng lúc {new Date(c.usedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon"
                    className={`h-8 w-8 rounded-xl ${isUsed ? "text-gray-400 hover:text-primary" : "text-emerald-600 hover:bg-emerald-50"}`}
                    title={isUsed ? "Khôi phục coupon" : "Đánh dấu đã sử dụng"}
                    onClick={() => handleMarkUsed(c.id, isUsed)}
                  >
                    <Check size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground" onClick={() => openEdit(c)}><Pencil size={13} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></Button>
                </div>
              </div>
            </div>
          );
        })}
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
  { id: "notices", label: "Thông báo", icon: Bell },
  { id: "booking", label: "Booking Vé", icon: Ticket },
  { id: "coupon", label: "Coupon", icon: Tag },
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
        {activeTab === "notices" && <NoticesTab />}
        {activeTab === "booking" && <BookingTab />}
        {activeTab === "coupon" && <CouponTab />}
      </div>
    </div>
  );
}
