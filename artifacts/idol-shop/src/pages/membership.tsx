import { useState } from "react";
import {
  Star, Gift, Package, Search, Trophy, ShoppingBag, Truck, Phone,
  ChevronDown, ChevronUp, Ticket, Calendar, MapPin, ExternalLink, Hash, Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

interface MemberProfile {
  stt: string;
  customerCode: string;
  name: string;
  phone: string;
  birthday: string;
  address: string;
  points: number;
  tier: string;
  yearPoints: number;
  redeemedPoints: number;
  vouchersGranted: number;
  vouchersUsed: number;
  vouchersRemaining: number;
  facebookName: string;
  facebookLink: string;
}

interface MemberShipping {
  customerCode: string;
  trackingCode: string;
  carrier: string;
  status: string;
  shippingFee: string;
}

interface SheetOrder {
  timestamp: string;
  name: string;
  phone: string;
  memberStatus: string;
  address: string;
  products: string;
  totalPrice: string;
  shippingMethod: string;
  notes: string;
}

const tierConfig: Record<string, {
  label: string;
  emoji: string;
  gradient: string;
  textColor: string;
  bg: string;
}> = {
  "newcomers": {
    label: "Newcomers",
    emoji: "⭐",
    gradient: "from-[#1e3a6b] via-[#2d5191] to-[#4a7cc9]",
    textColor: "text-blue-100",
    bg: "bg-blue-50 text-blue-700",
  },
  "bronze": {
    label: "Bronze",
    emoji: "🥉",
    gradient: "from-orange-700 via-orange-600 to-amber-500",
    textColor: "text-orange-100",
    bg: "bg-orange-50 text-orange-700",
  },
  "silver": {
    label: "Silver",
    emoji: "🥈",
    gradient: "from-slate-600 via-slate-500 to-gray-400",
    textColor: "text-slate-100",
    bg: "bg-slate-100 text-slate-600",
  },
  "gold": {
    label: "Gold",
    emoji: "🥇",
    gradient: "from-yellow-600 via-amber-500 to-yellow-400",
    textColor: "text-yellow-100",
    bg: "bg-amber-50 text-amber-700",
  },
  "platinum": {
    label: "Platinum",
    emoji: "💎",
    gradient: "from-violet-700 via-purple-600 to-fuchsia-500",
    textColor: "text-violet-100",
    bg: "bg-violet-50 text-violet-700",
  },
};

function getTierConfig(tier: string) {
  const key = tier.toLowerCase().trim();
  return tierConfig[key] ?? {
    label: tier,
    emoji: "⭐",
    gradient: "from-[#1e3a6b] via-[#2d5191] to-[#4a7cc9]",
    textColor: "text-blue-100",
    bg: "bg-blue-50 text-blue-700",
  };
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ShippingStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes("đã giao") || s.includes("giao thành công")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{status}</span>;
  }
  if (s.includes("đang vận chuyển") || s.includes("đang giao")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{status}</span>;
  }
  if (s.includes("đã gửi") || s.includes("đvvc")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{status}</span>;
  }
  if (s.includes("về kho") || s.includes("chờ")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{status}</span>;
  }
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{status}</span>;
}

function SheetOrderCard({ order }: { order: SheetOrder }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        className="w-full p-4 flex items-start gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <ShoppingBag size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm line-clamp-1">{order.products || "Đơn hàng"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.timestamp)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {order.totalPrice && (
            <span className="text-sm font-black text-primary">{order.totalPrice}</span>
          )}
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 bg-muted/30">
          {order.shippingMethod && (
            <div className="flex items-start gap-2">
              <Truck size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-xs">{order.shippingMethod}</span>
            </div>
          )}
          {order.address && (
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-xs">{order.address}</span>
            </div>
          )}
          {order.notes && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-muted-foreground font-semibold w-12 shrink-0 mt-0.5">Ghi chú</span>
              <span className="text-xs italic text-muted-foreground">{order.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MembershipPage() {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<MemberShipping[]>([]);
  const [orders, setOrders] = useState<SheetOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    const p = phone.trim();
    setSearchPhone(p);
    setProfile(null);
    setShipping([]);
    setOrders([]);
    setProfileError(null);

    setProfileLoading(true);
    const base = getBaseUrl();

    try {
      const [profileResp, ordersResp] = await Promise.all([
        fetch(`${base}/api/sheets/member-profile?phone=${encodeURIComponent(p)}`),
        fetch(`${base}/api/sheets/member-orders?phone=${encodeURIComponent(p)}`),
      ]);

      if (profileResp.ok) {
        const profileData: MemberProfile = await profileResp.json();
        setProfile(profileData);

        const shippingResp = await fetch(
          `${base}/api/sheets/member-shipping?code=${encodeURIComponent(profileData.customerCode)}`
        );
        if (shippingResp.ok) {
          setShipping(await shippingResp.json());
        }
      } else if (profileResp.status === 404) {
        setProfileError("Không tìm thấy thành viên");
      } else {
        setProfileError("Không thể kết nối dữ liệu");
      }

      if (ordersResp.ok) {
        setOrders(await ordersResp.json());
      }
    } catch {
      setProfileError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setProfileLoading(false);
    }
  };

  const tier = profile ? getTierConfig(profile.tier) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-10 pb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Star size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Thành Viên</h1>
            <p className="text-xs opacity-70 mt-0.5">Tích điểm · Voucher · Vận chuyển</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className="w-full bg-white/15 border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Nhập số điện thoại..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              data-testid="input-member-phone"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={profileLoading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5"
            data-testid="button-search-member"
          >
            <Search size={15} />
            Tra cứu
          </button>
        </div>
      </div>

      <div className="px-4 py-4 -mt-2 space-y-4 pb-28">
        {profileLoading && (
          <div className="space-y-3">
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        )}

        {!profileLoading && profileError && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto">
              <Trophy size={28} strokeWidth={1.3} className="text-muted-foreground" />
            </div>
            <p className="font-bold">Không tìm thấy thành viên</p>
            <p className="text-sm text-muted-foreground">Số điện thoại chưa đăng ký membership hoặc chưa có trong hệ thống.</p>
          </div>
        )}

        {!profileLoading && profile && tier && (
          <>
            <div
              className={`bg-gradient-to-br ${tier.gradient} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}
              data-testid="member-card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-black/10 translate-y-6 -translate-x-6" />

              <div className="relative flex items-start justify-between mb-1">
                <div>
                  <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Tiệm Chu Du</p>
                  <h2 className="text-2xl font-black mt-0.5">{profile.name}</h2>
                  <div className="flex items-center gap-1 mt-1 opacity-70">
                    <Hash size={11} />
                    <span className="text-xs font-mono font-semibold">{profile.customerCode}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl">{tier.emoji}</span>
                  <p className="text-sm font-black mt-0.5" data-testid="text-tier">{tier.label}</p>
                </div>
              </div>

              <div className="relative bg-white/15 rounded-xl p-3 mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs opacity-80 font-medium">Điểm tích lũy</span>
                  <span className="font-black text-xl" data-testid="text-points">
                    {profile.points.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-80 font-medium">Điểm trong năm</span>
                  <span className="text-sm font-bold opacity-90">
                    {profile.yearPoints.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} pts
                  </span>
                </div>
                {profile.redeemedPoints > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs opacity-80 font-medium">Đã quy đổi</span>
                    <span className="text-sm font-bold opacity-90">
                      -{profile.redeemedPoints.toLocaleString()} pts
                    </span>
                  </div>
                )}
              </div>

              {profile.phone && (
                <div className="relative flex items-center gap-1 mt-2 opacity-60">
                  <Phone size={11} />
                  <span className="text-xs font-medium">{profile.phone}</span>
                  {profile.birthday && (
                    <>
                      <span className="mx-1">·</span>
                      <Calendar size={11} />
                      <span className="text-xs">{profile.birthday}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {profile.vouchersGranted > 0 && (
              <div className="bg-card border border-primary/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ticket size={16} className="text-primary" />
                  <h3 className="font-bold text-base">Voucher Membership</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-primary">{profile.vouchersGranted}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Được tặng</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-muted-foreground">{profile.vouchersUsed}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Đã dùng</p>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
                    <p className="text-lg font-black text-primary">{profile.vouchersRemaining}</p>
                    <p className="text-[10px] text-primary/70 font-medium mt-0.5">Còn lại</p>
                  </div>
                </div>
              </div>
            )}

            {shipping.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={16} className="text-primary" />
                  <h3 className="font-bold text-base">Mã Vận Đơn</h3>
                </div>
                <div className="space-y-2">
                  {shipping.map((s, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">{s.carrier}</p>
                          <p className="font-mono font-bold text-base text-foreground">{s.trackingCode}</p>
                        </div>
                        <ShippingStatusBadge status={s.status} />
                      </div>
                      {s.shippingFee && (
                        <p className="text-xs text-muted-foreground">
                          Cước phí: <span className="font-semibold text-foreground">{s.shippingFee}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(profile.facebookName || profile.address) && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-primary" />
                  <h3 className="font-bold text-sm">Thông tin thêm</h3>
                </div>
                {profile.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{profile.address}</span>
                  </div>
                )}
                {profile.facebookName && (
                  <div className="flex items-center gap-2">
                    <ExternalLink size={13} className="text-muted-foreground shrink-0" />
                    {profile.facebookLink ? (
                      <a href={profile.facebookLink} target="_blank" rel="noreferrer"
                        className="text-sm text-primary font-medium underline underline-offset-2">
                        {profile.facebookName}
                      </a>
                    ) : (
                      <span className="text-sm">{profile.facebookName}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {!ordersLoading && orders.length > 0 && (() => {
              const recent = [...orders].reverse().slice(0, 4);
              return (
                <div className="bg-card border border-primary/15 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={15} className="text-primary" />
                    <h3 className="font-bold text-sm">Hàng Gần Nhất</h3>
                    <Badge variant="secondary" className="text-[10px] ml-auto">{orders.length} đơn tổng</Badge>
                  </div>
                  <div className="space-y-2">
                    {recent.map((order, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${i === 0 ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                            {order.products || "—"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{formatDate(order.timestamp)}</span>
                            {order.totalPrice && (
                              <>
                                <span className="text-muted-foreground/40 text-[10px]">·</span>
                                <span className="text-[10px] font-bold text-primary">{order.totalPrice}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(ordersLoading || orders.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag size={16} className="text-primary" />
                  <h3 className="font-bold text-base">Lịch Sử Đơn Hàng</h3>
                  <Badge variant="secondary" className="text-[10px]">{orders.length} đơn</Badge>
                </div>
                {ordersLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                  </div>
                )}
                {!ordersLoading && orders.length > 0 && (
                  <div className="space-y-2">
                    {[...orders].reverse().map((order, i) => (
                      <SheetOrderCard key={i} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!searchPhone && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-4">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Trophy size={36} strokeWidth={1.2} className="text-primary/40" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-foreground text-base">Kiểm tra thẻ thành viên</h3>
              <p className="text-sm mt-1">Nhập số điện thoại để xem thông tin membership, voucher và mã vận đơn</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {[
                { tier: "Newcomers", emoji: "⭐", desc: "Thành viên mới" },
                { tier: "Bronze", emoji: "🥉", desc: "Hạng đồng" },
                { tier: "Silver", emoji: "🥈", desc: "Hạng bạc" },
                { tier: "Platinum", emoji: "💎", desc: "Hạng kim cương" },
              ].map((t) => (
                <div key={t.tier} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <span className="text-2xl">{t.emoji}</span>
                  <p className="text-xs font-bold mt-1">{t.tier}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
