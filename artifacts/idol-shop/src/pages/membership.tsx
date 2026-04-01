import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLookupMember,
  getLookupMemberQueryKey,
  useListRewards,
  getListRewardsQueryKey,
  useListRedemptions,
  getListRedemptionsQueryKey,
  useRedeemReward,
} from "@workspace/api-client-react";
import { Star, Gift, Clock, Package, Search, Trophy, Sparkles, ShoppingBag, Truck, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

const tierConfig: Record<string, {
  label: string;
  emoji: string;
  gradient: string;
  badge: string;
  next: number;
  current: number;
}> = {
  bronze: { label: "Bronze", emoji: "🥉", gradient: "from-orange-600 to-amber-600", badge: "bg-orange-100 text-orange-700", next: 500, current: 0 },
  silver: { label: "Silver", emoji: "🥈", gradient: "from-slate-500 to-gray-600", badge: "bg-slate-100 text-slate-600", next: 2000, current: 500 },
  gold: { label: "Gold", emoji: "🥇", gradient: "from-amber-500 to-yellow-500", badge: "bg-amber-100 text-amber-700", next: 5000, current: 2000 },
  platinum: { label: "Platinum", emoji: "💎", gradient: "from-violet-600 to-purple-700", badge: "bg-violet-100 text-violet-700", next: 5000, current: 5000 },
};

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

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SheetOrderCard({ order }: { order: SheetOrder }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid="sheet-order-card">
      <button
        className="w-full p-4 flex items-start gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
          <ShoppingBag size={16} className="text-secondary" />
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
          {order.address && (
            <div className="flex items-start gap-2">
              <span className="text-[11px] text-muted-foreground font-semibold w-16 shrink-0 mt-0.5">Địa chỉ</span>
              <span className="text-[12px]">{order.address}</span>
            </div>
          )}
          {order.shippingMethod && (
            <div className="flex items-start gap-2">
              <span className="text-[11px] text-muted-foreground font-semibold w-16 shrink-0 mt-0.5">Vận chuyển</span>
              <span className="text-[12px]">{order.shippingMethod}</span>
            </div>
          )}
          {order.memberStatus && (
            <div className="flex items-start gap-2">
              <span className="text-[11px] text-muted-foreground font-semibold w-16 shrink-0 mt-0.5">Loại</span>
              <span className="text-[12px]">{order.memberStatus}</span>
            </div>
          )}
          {order.notes && (
            <div className="flex items-start gap-2">
              <span className="text-[11px] text-muted-foreground font-semibold w-16 shrink-0 mt-0.5">Ghi chú</span>
              <span className="text-[12px]">{order.notes}</span>
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
  const [sheetOrders, setSheetOrders] = useState<SheetOrder[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const { data: member, isLoading: memberLoading, error: memberError } = useLookupMember(
    { phone: searchPhone },
    { query: { enabled: !!searchPhone, queryKey: getLookupMemberQueryKey({ phone: searchPhone }) } }
  );

  const { data: rewards } = useListRewards();
  const { data: redemptions } = useListRedemptions(
    { memberId: member?.id },
    { query: { enabled: !!member?.id, queryKey: getListRedemptionsQueryKey({ memberId: member?.id }) } }
  );

  const redeemReward = useRedeemReward();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchSheetOrders = async (p: string) => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      const base = getBaseUrl();
      const resp = await fetch(`${base}/api/sheets/member-orders?phone=${encodeURIComponent(p)}`);
      if (!resp.ok) throw new Error("Không thể tải dữ liệu");
      const data = await resp.json();
      setSheetOrders(data);
    } catch {
      setSheetError("Không thể tải lịch sử từ Google Sheets");
      setSheetOrders([]);
    } finally {
      setSheetLoading(false);
    }
  };

  const handleSearch = () => {
    if (!phone.trim()) return;
    const p = phone.trim();
    setSearchPhone(p);
    fetchSheetOrders(p);
  };

  const handleRedeem = (rewardId: number) => {
    if (!member) return;
    redeemReward.mutate(
      { data: { memberId: member.id, rewardId } },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getLookupMemberQueryKey({ phone: searchPhone }) });
          queryClient.invalidateQueries({ queryKey: getListRedemptionsQueryKey({ memberId: member.id }) });
          queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() });
          toast({ title: "Đổi quà thành công!", description: `Còn lại ${result.remainingPoints} điểm` });
        },
        onError: () => {
          toast({ title: "Không thể đổi quà", description: "Không đủ điểm hoặc quà hết hàng", variant: "destructive" });
        },
      }
    );
  };

  const tier = member ? (tierConfig[member.tier] ?? tierConfig.bronze) : null;
  const tierProgress = tier
    ? member!.tier === "platinum"
      ? 100
      : Math.min(100, ((member!.points - tier.current) / (tier.next - tier.current)) * 100)
    : 0;

  const nextTierName = member
    ? member.tier === "bronze" ? "Silver" : member.tier === "silver" ? "Gold" : "Platinum"
    : "";

  const isLoaded = searchPhone && !memberLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-10 pb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Star size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Thành Viên</h1>
            <p className="text-xs opacity-70 mt-0.5">Tích điểm · Đổi quà · Lịch sử đơn</p>
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
            className="bg-primary hover:bg-primary/90 text-white px-4 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5"
            data-testid="button-search-member"
          >
            <Search size={15} />
            Tra cứu
          </button>
        </div>
      </div>

      <div className="px-4 py-4 -mt-2 space-y-4">
        {memberLoading && (
          <div className="space-y-3">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        )}

        {isLoaded && memberError && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto">
              <Trophy size={28} strokeWidth={1.3} className="text-muted-foreground" />
            </div>
            <p className="font-bold">Không tìm thấy thành viên</p>
            <p className="text-sm text-muted-foreground">Số điện thoại này chưa được đăng ký membership</p>
          </div>
        )}

        {member && tier && (
          <>
            <div
              className={`bg-gradient-to-br ${tier.gradient} rounded-2xl p-5 text-white shadow-lg pink-glow`}
              data-testid="member-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs opacity-70 font-semibold uppercase tracking-widest">Thành Viên</p>
                  <h2 className="text-2xl font-black mt-0.5">{member.name}</h2>
                  <p className="text-sm opacity-70 mt-0.5 flex items-center gap-1">
                    <Phone size={12} /> {member.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl">{tier.emoji}</span>
                  <p className="text-sm font-black mt-0.5" data-testid="text-tier">{tier.label}</p>
                </div>
              </div>

              <div className="bg-white/15 rounded-xl p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="opacity-80 font-medium">Điểm tích lũy</span>
                  <span className="font-black text-lg" data-testid="text-points">{member.points.toLocaleString()} pts</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all"
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
                {member.tier !== "platinum" && (
                  <p className="text-xs opacity-60 mt-1.5">
                    Còn {(tier.next - member.points).toLocaleString()} điểm → {nextTierName}
                  </p>
                )}
              </div>
            </div>

            {rewards && rewards.filter((r) => r.isAvailable && r.stock > 0).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gift size={16} className="text-primary" />
                  <h3 className="font-bold text-base">Đổi Quà</h3>
                </div>
                <div className="space-y-2">
                  {rewards.filter((r) => r.isAvailable && r.stock > 0).map((reward) => {
                    const canRedeem = member.points >= reward.pointsCost;
                    return (
                      <div
                        key={reward.id}
                        className={`flex items-center gap-3 bg-card border rounded-2xl p-3 transition-all ${canRedeem ? "border-primary/30" : "border-border"}`}
                        data-testid={`reward-item-${reward.id}`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${canRedeem ? "bg-primary/10" : "bg-muted"}`}>
                          <Gift size={20} className={canRedeem ? "text-primary" : "text-muted-foreground"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{reward.name}</p>
                          {reward.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{reward.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <Sparkles size={10} className="text-amber-500" />
                            <span className="text-xs font-black text-amber-600">{reward.pointsCost.toLocaleString()} pts</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={canRedeem ? "default" : "outline"}
                          disabled={!canRedeem || redeemReward.isPending}
                          onClick={() => handleRedeem(reward.id)}
                          className="shrink-0 rounded-xl"
                          data-testid={`button-redeem-${reward.id}`}
                        >
                          Đổi
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {redemptions && redemptions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gift size={16} className="text-muted-foreground" />
                  <h3 className="font-bold text-base">Lịch Sử Đổi Quà</h3>
                </div>
                <div className="space-y-2">
                  {[...redemptions].reverse().map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-card border border-border rounded-2xl p-3">
                      <div>
                        <p className="text-sm font-semibold">{r.rewardName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <span className="text-xs font-black text-destructive">-{r.pointsUsed} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {(isLoaded || sheetOrders.length > 0 || sheetLoading) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={16} className="text-primary" />
              <h3 className="font-bold text-base">Lịch Sử Đơn Hàng</h3>
              <Badge variant="secondary" className="text-[10px]">từ Google Sheets</Badge>
            </div>

            {sheetLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            )}

            {sheetError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                {sheetError}
              </div>
            )}

            {!sheetLoading && !sheetError && sheetOrders.length === 0 && searchPhone && (
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <Package size={28} strokeWidth={1.2} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào được tìm thấy</p>
              </div>
            )}

            {!sheetLoading && sheetOrders.length > 0 && (
              <div className="space-y-2">
                {sheetOrders.map((order, i) => (
                  <SheetOrderCard key={i} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {!searchPhone && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Trophy size={36} strokeWidth={1.2} className="text-primary/40" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-foreground text-base">Kiểm tra thẻ thành viên</h3>
              <p className="text-sm mt-1">Nhập số điện thoại để xem điểm, đổi quà và lịch sử đơn hàng</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
              {[
                { tier: "Bronze", emoji: "🥉", pts: "0 pts" },
                { tier: "Silver", emoji: "🥈", pts: "500 pts" },
                { tier: "Gold", emoji: "🥇", pts: "2.000 pts" },
                { tier: "Platinum", emoji: "💎", pts: "5.000 pts" },
              ].map((t) => (
                <div key={t.tier} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <span className="text-xl">{t.emoji}</span>
                  <p className="text-xs font-bold mt-1">{t.tier}</p>
                  <p className="text-[10px] text-muted-foreground">{t.pts}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
