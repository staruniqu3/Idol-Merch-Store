import { useState, useEffect } from "react";
import { useListShippingUpdates } from "@workspace/api-client-react";
import { Truck, Package, CheckCircle, Clock, ChevronRight, X, MapPin, Calendar, Search, Hash, ExternalLink, Bell, Pin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  dot: string;
  gradient: string;
}> = {
  web_order: {
    label: "Web trả hàng",
    icon: <Clock size={16} />,
    color: "text-sky-600",
    bg: "bg-sky-50",
    dot: "bg-sky-400",
    gradient: "from-sky-400 to-cyan-500",
  },
  warehouse_origin: {
    label: "Đã về kho tại nước sở tại",
    icon: <Package size={16} />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    dot: "bg-indigo-400",
    gradient: "from-indigo-400 to-blue-500",
  },
  warehouse_vn: {
    label: "Về kho Việt",
    icon: <MapPin size={16} />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-purple-600",
  },
  sorting: {
    label: "Phân loại hàng",
    icon: <Package size={16} />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    dot: "bg-orange-400",
    gradient: "from-orange-400 to-amber-500",
  },
  preparing: {
    label: "Chuẩn bị giao",
    icon: <Clock size={16} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
    gradient: "from-amber-400 to-orange-500",
  },
  in_transit: {
    label: "Đang giao",
    icon: <Truck size={16} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-500",
  },
  arrived: {
    label: "Đã về kho",
    icon: <Package size={16} />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-purple-600",
  },
  delivered: {
    label: "Đã giao",
    icon: <CheckCircle size={16} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
  },
  returned: {
    label: "Trả đơn toàn bộ",
    icon: <CheckCircle size={16} />,
    color: "text-teal-600",
    bg: "bg-teal-50",
    dot: "bg-teal-500",
    gradient: "from-teal-500 to-emerald-600",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface SheetShipping {
  customerCode: string;
  name: string;
  phone: string;
  trackingCode: string;
  carrier: string;
  status: string;
  shippingFee: string;
}

type Update = {
  id: number;
  title: string;
  description: string;
  status: string;
  estimatedDate: string | null;
  createdAt: string;
};

function normalizeSheetStatus(status: string): { label: string; dot: string; bg: string; color: string; gradient: string } {
  const s = status.toLowerCase();
  if (s.includes("đã giao") || s.includes("giao thành công")) {
    return { label: status, dot: "bg-emerald-500", bg: "bg-emerald-50", color: "text-emerald-700", gradient: "from-emerald-500 to-teal-500" };
  }
  if (s.includes("đang giao") || s.includes("đang vận chuyển") || s.includes("đang chuyển")) {
    return { label: status, dot: "bg-blue-500", bg: "bg-blue-50", color: "text-blue-700", gradient: "from-blue-500 to-indigo-500" };
  }
  if (s.includes("đã gửi") || s.includes("đvvc") || s.includes("lấy hàng")) {
    return { label: status, dot: "bg-violet-500", bg: "bg-violet-50", color: "text-violet-700", gradient: "from-violet-500 to-purple-600" };
  }
  if (s.includes("về kho") || s.includes("chờ")) {
    return { label: status, dot: "bg-amber-500", bg: "bg-amber-50", color: "text-amber-700", gradient: "from-amber-400 to-orange-500" };
  }
  return { label: status, dot: "bg-gray-400", bg: "bg-gray-50", color: "text-gray-600", gradient: "from-gray-400 to-gray-500" };
}

function ShippingModal({ update, onClose }: { update: Update; onClose: () => void }) {
  const config = statusConfig[update.status] ?? statusConfig.preparing;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${config.gradient} p-5 pt-6`}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">{config.icon}</div>
            <div>
              <p className="text-xs font-medium opacity-80">{config.label}</p>
              <h3 className="text-lg font-bold leading-tight">{update.title}</h3>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">{update.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Calendar size={13} />
                <span className="text-[11px] font-semibold">Ngày đăng</span>
              </div>
              <p className="text-sm font-bold">{formatDate(update.createdAt)}</p>
            </div>
            {update.estimatedDate && (
              <div className="bg-primary/10 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-primary mb-1">
                  <MapPin size={13} />
                  <span className="text-[11px] font-semibold">Dự kiến</span>
                </div>
                <p className="text-sm font-bold text-primary">{update.estimatedDate}</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm">Đóng</button>
        </div>
      </div>
    </div>
  );
}

type TrackingResult = {
  orderCode: string;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
  shippingFee?: number | null;
  status: string;
  orderType: string;
  orderDate: string;
};

const orderStatusLabels: Record<string, string> = {
  awaiting: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  pending: "Đang xử lý",
  shipped: "Đã giao ĐVVC",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

type NoticeItem = { id: number; title: string; content: string; type: string; isPinned: boolean; createdAt: string };

export default function ShippingPage() {
  const { data: updates, isLoading: updatesLoading } = useListShippingUpdates();
  const [selected, setSelected] = useState<Update | null>(null);
  const [sheetData, setSheetData] = useState<SheetShipping[]>([]);
  const [sheetLoading, setSheetLoading] = useState(true);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupResults, setLookupResults] = useState<TrackingResult[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null);

  const handleTrackingLookup = async () => {
    if (!lookupPhone.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResults(null);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/tracking?phone=${encodeURIComponent(lookupPhone.trim())}&_t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) { setLookupError("Có lỗi xảy ra, vui lòng thử lại"); return; }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setLookupError("Không tìm thấy đơn hàng nào với số điện thoại này");
      } else {
        setLookupResults(data);
      }
    } catch { setLookupError("Có lỗi xảy ra, vui lòng thử lại"); }
    finally { setLookupLoading(false); }
  };

  useEffect(() => {
    const base = getBaseUrl();
    fetch(`${base}/api/sheets/all-shipping?_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setSheetData(Array.isArray(data) ? data : []); setSheetLoading(false); })
      .catch(() => setSheetLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/notices`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setNotices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const sorted = updates ? [...updates].reverse() : [];

  const filteredSheet = sheetData;

  const totalTracking = sheetData.length;
  const deliveredCount = sheetData.filter((s) => s.status.toLowerCase().includes("đã giao")).length;

  return (
    <div className="min-h-screen bg-background">
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <div className="hero-gradient px-4 pt-10 pb-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Theo Dõi Vận Chuyển</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-black leading-none">{totalTracking}</p>
              <p className="text-[9px] opacity-70 font-semibold">Tổng</p>
            </div>
            <div className="bg-emerald-400/25 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-black leading-none">{deliveredCount}</p>
              <p className="text-[9px] opacity-70 font-semibold">Đã giao</p>
            </div>
          </div>
        </div>

      </div>

      <div className="px-4 py-4 -mt-2 space-y-5 pb-28">

        {/* Phone-based tracking lookup */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Tra cứu vận đơn</h2>
            <Badge variant="secondary" className="text-[10px]">theo số điện thoại</Badge>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 space-y-3">
            <p className="text-[11px] text-muted-foreground">Nhập số điện thoại đặt hàng để tra cứu mã vận đơn — thông tin cá nhân không được hiển thị.</p>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="0912 345 678"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleTrackingLookup(); }}
                type="tel"
              />
              <button
                onClick={handleTrackingLookup}
                disabled={lookupLoading || !lookupPhone.trim()}
                className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {lookupLoading ? "..." : "Tra cứu"}
              </button>
            </div>
            {lookupError && (
              <p className="text-xs text-destructive font-medium">{lookupError}</p>
            )}
            {lookupResults && lookupResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">Mã vận đơn</span>
                  <Badge variant="secondary" className="text-[10px]">theo dõi vận chuyển</Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto">{lookupResults.length} mã</span>
                </div>
                {lookupResults.map((r, i) => {
                  const hasTracking = !!r.trackingNumber;
                  return (
                    <div key={i} className="bg-muted/60 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="font-mono font-bold text-sm">{r.orderCode}</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">{orderStatusLabels[r.status] ?? r.status}</Badge>
                      </div>
                      {hasTracking ? (
                        <>
                          <p className="font-mono text-xs text-primary font-bold pl-4">{r.trackingNumber}</p>
                          <div className="flex flex-wrap gap-1.5 pl-4">
                            {r.shippingCarrier && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground border border-border uppercase tracking-wide">
                                {r.shippingCarrier}
                              </span>
                            )}
                            {r.shippingFee != null && (
                              <span className="text-[10px] font-semibold text-muted-foreground">{formatVND(r.shippingFee)}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-muted-foreground pl-4 italic">Chưa có mã vận đơn — shop sẽ cập nhật sớm</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Google Sheet tracking section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hash size={14} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Mã vận đơn</h2>
            <Badge variant="secondary" className="text-[10px]">theo dõi vận chuyển</Badge>
            {!sheetLoading && <span className="text-[10px] text-muted-foreground ml-auto">{filteredSheet.length} mã</span>}
          </div>

          {sheetLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          )}

          {!sheetLoading && filteredSheet.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Truck size={28} strokeWidth={1.2} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {sheetData.length === 0 ? "Chưa có mã vận đơn nào" : "Không tìm thấy kết quả"}
              </p>
            </div>
          )}

          {!sheetLoading && filteredSheet.length > 0 && (
            <div className="space-y-2">
              {filteredSheet.map((s, i) => {
                const cfg = normalizeSheetStatus(s.status);
                return (
                  <div key={i} className={`bg-card border border-border rounded-2xl p-4 ${cfg.bg.replace("bg-", "border-l-4 border-l-").replace("50", "400")}`}
                    style={{ borderLeftColor: "" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-base font-extrabold font-mono tracking-wide">{s.customerCode}</span>
                            {s.phone && (
                              <span className="text-[11px] text-muted-foreground font-mono">{s.phone}</span>
                            )}
                          </div>
                          <p className={`text-xs font-bold font-mono ${cfg.color}`}>{s.trackingCode}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {s.carrier && (
                              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-semibold">{s.carrier}</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                            {s.shippingFee && (
                              <span className="text-[10px] text-muted-foreground">{s.shippingFee}đ</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://tracking.ghn.dev/?order_id=${s.trackingCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 w-8 h-8 bg-muted rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={13} className="text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DB shipping announcements */}
        {(updatesLoading || sorted.length > 0) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck size={14} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Thông báo lô hàng</h2>
            </div>

            {updatesLoading && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            )}

            <div className="space-y-2">
              {sorted.map((update, idx) => {
                const config = statusConfig[update.status] ?? statusConfig.preparing;
                const isFirst = idx === 0;
                return (
                  <button
                    key={update.id}
                    className={`w-full bg-card border border-border rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${isFirst ? "ring-2 ring-primary/20" : ""}`}
                    onClick={() => setSelected(update as Update)}
                    data-testid={`shipping-card-${update.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {isFirst && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">MỚI NHẤT</span>}
                          <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="font-bold text-sm truncate">{update.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{update.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{formatDate(update.createdAt)}</span>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </div>
                    </div>
                    {update.estimatedDate && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
                        <MapPin size={11} className="text-primary" />
                        <span className="text-xs text-muted-foreground">Dự kiến:</span>
                        <span className="text-xs font-bold text-primary">{update.estimatedDate}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notices section */}
      {notices.length > 0 && (
        <div className="px-4 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-rose-500" />
            <h2 className="text-sm font-bold text-foreground">Thông báo</h2>
            <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">{notices.length}</span>
          </div>
          <div className="space-y-2">
            {notices.map((n) => {
              const isExpanded = expandedNotice === n.id;
              const typeCfg: Record<string, { label: string; cls: string }> = {
                general: { label: "📣 Thông báo", cls: "bg-primary/10 text-primary" },
                looking: { label: "🔍 Tìm khách", cls: "bg-rose-100 text-rose-600" },
              };
              const tc = typeCfg[n.type] ?? { label: n.type, cls: "bg-muted text-muted-foreground" };
              return (
                <button
                  key={n.id}
                  className={`w-full bg-card border rounded-2xl p-4 text-left transition-all active:scale-[0.99] ${n.isPinned ? "border-primary/30 ring-1 ring-primary/20" : "border-border"}`}
                  onClick={() => setExpandedNotice(isExpanded ? null : n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${n.type === "looking" ? "bg-rose-100" : "bg-primary/10"}`}>
                      {n.type === "looking" ? "🔍" : "📣"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {n.isPinned && <Pin size={10} className="text-primary shrink-0" />}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tc.cls}`}>{tc.label}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <p className="font-bold text-sm">{n.title}</p>
                      <p className={`text-xs text-muted-foreground mt-1 ${isExpanded ? "" : "line-clamp-2"}`}>{n.content}</p>
                      {!isExpanded && n.content.length > 100 && (
                        <span className="text-[11px] text-primary font-semibold mt-0.5 inline-block">Xem thêm...</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && <ShippingModal update={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
