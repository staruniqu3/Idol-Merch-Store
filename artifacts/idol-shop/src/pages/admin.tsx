import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts, getListProductsQueryKey, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListOrders, getListOrdersQueryKey, useUpdateOrder,
  useListShippingUpdates, getListShippingUpdatesQueryKey, useCreateShippingUpdate, useUpdateShippingUpdate, useDeleteShippingUpdate,
  useListMembers, getListMembersQueryKey, useCreateMember, useUpdateMember, useAddPoints,
  useListRewards, getListRewardsQueryKey, useCreateReward, useDeleteReward,
  useGetOrderSummary, getGetOrderSummaryQueryKey,
} from "@workspace/api-client-react";
import {
  Shield, Package, ShoppingBag, Truck, Users, Gift, LogOut, Plus, Pencil, Trash2, Check, X, ChevronDown,
  TrendingUp, Star, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const ADMIN_PASSWORD = "admin123";

function formatPrice(p: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusLabels: Record<string, string> = {
  pending: "Cho xac nhan", confirmed: "Da xac nhan", shipped: "Dang giao", delivered: "Da giao", cancelled: "Da huy",
};
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700", delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const shippingStatusOptions = ["preparing", "in_transit", "arrived", "delivered"];
const shippingStatusLabels: Record<string, string> = {
  preparing: "Chuan bi", in_transit: "Dang van chuyen", arrived: "Da ve kho", delivered: "Da giao",
};

// ======================== Login ========================
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { onLogin(); }
    else { setError(true); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs bg-card border border-border rounded-2xl p-6 shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield size={28} className="text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center mb-1">Admin Panel</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">Nhap mat khau de tiep tuc</p>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="Mat khau"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            data-testid="input-admin-password"
          />
          {error && <p className="text-destructive text-xs">Mat khau khong dung</p>}
          <Button className="w-full" onClick={handleLogin} data-testid="button-admin-login">Dang nhap</Button>
        </div>
      </div>
    </div>
  );
}

// ======================== Products Tab ========================
function ProductsTab() {
  const { data: products, isLoading } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "photocard", stock: "0", isAvailable: true, orderType: "preorder", imageUrl: "" });

  const resetForm = () => setForm({ name: "", description: "", price: "", category: "photocard", stock: "0", isAvailable: true, orderType: "preorder", imageUrl: "" });

  const openEdit = (p: NonNullable<typeof products>[0]) => {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), category: p.category, stock: String(p.stock), isAvailable: p.isAvailable, orderType: p.orderType, imageUrl: p.imageUrl ?? "" });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) { toast({ title: "Vui long nhap du thong tin", variant: "destructive" }); return; }
    const data = { name: form.name, description: form.description || null, price: parseFloat(form.price), category: form.category, stock: parseInt(form.stock), isAvailable: form.isAvailable, orderType: form.orderType, imageUrl: form.imageUrl || null };
    if (editId) {
      updateProduct.mutate({ id: editId, data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); resetForm(); setEditId(null); toast({ title: "Da cap nhat san pham" }); },
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); resetForm(); toast({ title: "Da them san pham moi" }); },
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteProduct.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast({ title: "Da xoa san pham" }); },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">San Pham ({products?.length ?? 0})</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-product"><Plus size={14} className="mr-1" />Them</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Sua san pham" : "Them san pham moi"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label>Ten san pham *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-product-name" /></div>
              <div><Label>Mo ta</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Gia (VND) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="input-product-price" /></div>
                <div><Label>Ton kho</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Danh muc</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["photocard", "album", "lightstick", "goods"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Loai</Label>
                  <Select value={form.orderType} onValueChange={(v) => setForm({ ...form, orderType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preorder">Pre-order</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>URL anh</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} id="available" />
                <Label htmlFor="available">Dang ban</Label>
              </div>
              <Button className="w-full" onClick={handleSave} data-testid="button-save-product">Luu</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {products?.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3" data-testid={`admin-product-${p.id}`}>
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <Package size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-primary font-bold">{formatPrice(p.price)}</span>
                <span className="text-xs text-muted-foreground">Kho: {p.stock}</span>
                {!p.isAvailable && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">Tam tat</Badge>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}><Pencil size={14} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)} data-testid={`button-delete-product-${p.id}`}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== Orders Tab ========================
function OrdersTab() {
  const { data: orders } = useListOrders();
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleStatusChange = (id: number, status: string) => {
    updateOrder.mutate({ id, data: { status } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }); toast({ title: "Cap nhat trang thai thanh cong" }); },
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold">Don Hang ({orders?.length ?? 0})</h3>
      <div className="space-y-2">
        {orders && [...orders].reverse().map((order) => {
          let items: Array<{ name: string; quantity: number; price: number }> = [];
          try { items = JSON.parse(order.items); } catch {}
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden" data-testid={`admin-order-${order.id}`}>
              <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">#{order.id} - {order.memberName}</span>
                    <Badge className={`text-[10px] ${statusColors[order.status] ?? ""}`} variant="secondary">
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.memberPhone} • {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-sm text-primary">{formatPrice(order.totalAmount)}</span>
                  <ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border p-3 space-y-3">
                  <div>
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="text-muted-foreground">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && <p className="text-xs bg-muted rounded-lg p-2 text-muted-foreground">Ghi chu: {order.notes}</p>}
                  <div>
                    <Label className="text-xs">Cap nhat trang thai</Label>
                    <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                      <SelectTrigger className="mt-1" data-testid={`select-status-${order.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================== Shipping Tab ========================
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
    setEditId(u.id);
    setForm({ title: u.title, description: u.description, status: u.status, estimatedDate: u.estimatedDate ?? "" });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.description) { toast({ title: "Vui long nhap du thong tin", variant: "destructive" }); return; }
    const data = { title: form.title, description: form.description, status: form.status, estimatedDate: form.estimatedDate || null };
    if (editId) {
      updateUpdate.mutate({ id: editId, data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }); setOpen(false); resetForm(); setEditId(null); toast({ title: "Da cap nhat" }); },
      });
    } else {
      createUpdate.mutate({ data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }); setOpen(false); resetForm(); toast({ title: "Da them cap nhat van chuyen" }); },
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteUpdate.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }); toast({ title: "Da xoa" }); },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Van Chuyen ({updates?.length ?? 0})</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-shipping"><Plus size={14} className="mr-1" />Them</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Sua cap nhat" : "Cap nhat van chuyen"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label>Tieu de *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-shipping-title" /></div>
              <div><Label>Mo ta *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div>
                <Label>Trang thai</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {shippingStatusOptions.map((s) => <SelectItem key={s} value={s}>{shippingStatusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Ngay du kien</Label><Input type="date" value={form.estimatedDate} onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })} /></div>
              <Button className="w-full" onClick={handleSave} data-testid="button-save-shipping">Luu</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {updates && [...updates].reverse().map((u) => (
          <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3" data-testid={`admin-shipping-${u.id}`}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{u.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.description}</p>
              <Badge variant="outline" className="text-[10px] mt-1">{shippingStatusLabels[u.status] ?? u.status}</Badge>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== Members Tab ========================
function MembersTab() {
  const { data: members } = useListMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const addPoints = useAddPoints();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  // Rewards management
  const { data: rewards } = useListRewards();
  const createReward = useCreateReward();
  const deleteReward = useDeleteReward();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: "", description: "", pointsCost: "", stock: "10", imageUrl: "" });

  const resetForm = () => setForm({ name: "", phone: "", email: "", notes: "" });

  const handleCreateMember = () => {
    if (!form.name || !form.phone) { toast({ title: "Vui long nhap ten va so dien thoai", variant: "destructive" }); return; }
    createMember.mutate({ data: { name: form.name, phone: form.phone, email: form.email || null, notes: form.notes || null } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() }); setOpen(false); resetForm(); toast({ title: "Da them thanh vien moi" }); },
      onError: () => toast({ title: "So dien thoai da ton tai", variant: "destructive" }),
    });
  };

  const handleAddPoints = () => {
    if (!selectedMemberId || !pointsAmount) return;
    addPoints.mutate({ id: selectedMemberId, data: { points: parseInt(pointsAmount), reason: null } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() }); setPointsOpen(false); setPointsAmount(""); toast({ title: "Da them diem thanh cong" }); },
    });
  };

  const handleCreateReward = () => {
    if (!rewardForm.name || !rewardForm.pointsCost) { toast({ title: "Vui long nhap du thong tin", variant: "destructive" }); return; }
    createReward.mutate({ data: { name: rewardForm.name, description: rewardForm.description || null, pointsCost: parseInt(rewardForm.pointsCost), stock: parseInt(rewardForm.stock), isAvailable: true, imageUrl: rewardForm.imageUrl || null } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() }); setRewardOpen(false); setRewardForm({ name: "", description: "", pointsCost: "", stock: "10", imageUrl: "" }); toast({ title: "Da them qua tang moi" }); },
    });
  };

  const handleDeleteReward = (id: number) => {
    deleteReward.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() }); toast({ title: "Da xoa qua tang" }); },
    });
  };

  const tierColors: Record<string, string> = {
    bronze: "text-orange-600", silver: "text-slate-500", gold: "text-amber-500", platinum: "text-violet-600",
  };

  return (
    <div className="space-y-4">
      {/* Members */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Thanh Vien ({members?.length ?? 0})</h3>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-member"><Plus size={14} className="mr-1" />Them</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Them thanh vien moi</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><Label>Ho ten *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-member-name" /></div>
                <div><Label>So dien thoai *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-member-phone-admin" /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Ghi chu</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <Button className="w-full" onClick={handleCreateMember} data-testid="button-save-member">Them thanh vien</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Add Points Dialog */}
        <Dialog open={pointsOpen} onOpenChange={setPointsOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Them diem cho thanh vien</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">Them diem cho: {members?.find((m) => m.id === selectedMemberId)?.name}</p>
              <div><Label>So diem them</Label><Input type="number" value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)} data-testid="input-points-amount" /></div>
              <Button className="w-full" onClick={handleAddPoints} data-testid="button-save-points">Them diem</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-2">
          {members?.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3" data-testid={`admin-member-${m.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{m.name}</p>
                  <span className={`text-xs font-bold capitalize ${tierColors[m.tier] ?? ""}`}>{m.tier}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.phone}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Sparkles size={10} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">{m.points.toLocaleString()} diem</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedMemberId(m.id); setPointsOpen(true); }} data-testid={`button-add-points-${m.id}`}>
                <Plus size={12} className="mr-1" />Diem
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Qua Tang ({rewards?.length ?? 0})</h3>
          <Dialog open={rewardOpen} onOpenChange={setRewardOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-add-reward"><Plus size={14} className="mr-1" />Qua</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Them qua tang moi</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><Label>Ten qua *</Label><Input value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} data-testid="input-reward-name" /></div>
                <div><Label>Mo ta</Label><Textarea value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Diem doi *</Label><Input type="number" value={rewardForm.pointsCost} onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: e.target.value })} data-testid="input-reward-points" /></div>
                  <div><Label>So luong</Label><Input type="number" value={rewardForm.stock} onChange={(e) => setRewardForm({ ...rewardForm, stock: e.target.value })} /></div>
                </div>
                <Button className="w-full" onClick={handleCreateReward} data-testid="button-save-reward">Them qua tang</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {rewards?.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3" data-testid={`admin-reward-${r.id}`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-amber-600">{r.pointsCost.toLocaleString()} diem</span>
                  <span className="text-xs text-muted-foreground">Kho: {r.stock}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteReward(r.id)} data-testid={`button-delete-reward-${r.id}`}><Trash2 size={14} /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======================== Summary Stats ========================
function SummaryStats() {
  const { data: summary } = useGetOrderSummary();
  if (!summary) return null;
  const stats = [
    { label: "Tong don", value: summary.totalOrders, color: "text-primary" },
    { label: "Cho xu ly", value: summary.pendingOrders, color: "text-amber-600" },
    { label: "Dang giao", value: summary.shippedOrders, color: "text-blue-600" },
    { label: "Thanh vien", value: summary.totalMembers, color: "text-violet-600" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 mb-4" data-testid="admin-summary">
      {stats.map((s) => (
        <div key={s.label} className="bg-card border border-border rounded-xl p-2 text-center">
          <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ======================== Main Admin Page ========================
const TABS = [
  { id: "products", label: "San pham", icon: Package },
  { id: "orders", label: "Don hang", icon: ShoppingBag },
  { id: "shipping", label: "Van chuyen", icon: Truck },
  { id: "members", label: "Thanh vien", icon: Users },
];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("admin_authenticated") === "true");
  const [activeTab, setActiveTab] = useState("products");

  const handleLogin = () => {
    localStorage.setItem("admin_authenticated", "true");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          <h1 className="text-xl font-bold">Admin</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
          <LogOut size={16} className="mr-1" />Dang xuat
        </Button>
      </div>

      <div className="px-4 py-4">
        <SummaryStats />

        {/* Tab navigation */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap min-w-0 ${
                activeTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${id}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "products" && <ProductsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "shipping" && <ShippingTab />}
        {activeTab === "members" && <MembersTab />}
      </div>
    </div>
  );
}
