import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLookupMember,
  getLookupMemberQueryKey,
  useListOrders,
  getListOrdersQueryKey,
  useListRewards,
  getListRewardsQueryKey,
  useListRedemptions,
  getListRedemptionsQueryKey,
  useRedeemReward,
} from "@workspace/api-client-react";
import { Star, Gift, Clock, Package, Search, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const tierConfig: Record<string, { label: string; color: string; bg: string; next: number; current: number }> = {
  bronze: { label: "Bronze", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", next: 500, current: 0 },
  silver: { label: "Silver", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", next: 2000, current: 500 },
  gold: { label: "Gold", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", next: 5000, current: 2000 },
  platinum: { label: "Platinum", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", next: 5000, current: 5000 },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const statusLabels: Record<string, string> = {
  pending: "Cho xac nhan",
  confirmed: "Da xac nhan",
  shipped: "Dang giao",
  delivered: "Da giao",
  cancelled: "Da huy",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function MembershipPage() {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const { data: member, isLoading: memberLoading, error: memberError } = useLookupMember(
    { phone: searchPhone },
    { query: { enabled: !!searchPhone, queryKey: getLookupMemberQueryKey({ phone: searchPhone }) } }
  );

  const { data: orders } = useListOrders(
    { memberId: member?.id },
    { query: { enabled: !!member?.id, queryKey: getListOrdersQueryKey({ memberId: member?.id }) } }
  );

  const { data: rewards } = useListRewards();
  const { data: redemptions } = useListRedemptions(
    { memberId: member?.id },
    { query: { enabled: !!member?.id, queryKey: getListRedemptionsQueryKey({ memberId: member?.id }) } }
  );

  const redeemReward = useRedeemReward();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSearch = () => {
    if (!phone.trim()) return;
    setSearchPhone(phone.trim());
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
          toast({ title: "Doi qua thanh cong!", description: `Con lai ${result.remainingPoints} diem` });
        },
        onError: () => {
          toast({ title: "Khong the doi qua", description: "Khong du diem hoac qua het hang", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold">Membership</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Tich diem, doi qua, xem lich su</p>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Lookup */}
        <div className="flex gap-2">
          <Input
            placeholder="Nhap so dien thoai..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            data-testid="input-member-phone"
          />
          <Button onClick={handleSearch} className="shrink-0" data-testid="button-search-member">
            <Search size={16} />
          </Button>
        </div>

        {memberLoading && (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        )}

        {searchPhone && memberError && !memberLoading && (
          <div className="text-center py-10 text-muted-foreground">
            <Trophy size={48} strokeWidth={1.2} className="mx-auto mb-3" />
            <p className="font-semibold">Khong tim thay thanh vien</p>
            <p className="text-sm mt-1">So dien thoai nay chua duoc dang ky</p>
          </div>
        )}

        {member && tier && (
          <>
            {/* Member Card */}
            <div className="bg-gradient-to-br from-primary/90 to-secondary/90 rounded-2xl p-5 text-white shadow-lg" data-testid="member-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80">Thanh vien</p>
                  <h2 className="text-2xl font-black mt-0.5">{member.name}</h2>
                  <p className="text-sm opacity-80 mt-0.5">{member.phone}</p>
                </div>
                <Badge className={`${tier.bg} ${tier.color} border font-bold`} data-testid="text-tier">
                  <Star size={12} className="mr-1" />
                  {tier.label}
                </Badge>
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="opacity-80">Diem tich luy</span>
                  <span className="font-bold" data-testid="text-points">{member.points.toLocaleString()} diem</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${tierProgress}%` }} />
                </div>
                {member.tier !== "platinum" && (
                  <p className="text-xs opacity-70 mt-1">
                    Con {(tier.next - member.points).toLocaleString()} diem len {
                      member.tier === "bronze" ? "Silver" :
                      member.tier === "silver" ? "Gold" : "Platinum"
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Rewards Section */}
            {rewards && rewards.length > 0 && (
              <div>
                <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                  <Gift size={18} className="text-primary" />
                  Doi Qua
                </h3>
                <div className="space-y-3">
                  {rewards.filter((r) => r.isAvailable && r.stock > 0).map((reward) => (
                    <div key={reward.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3" data-testid={`reward-item-${reward.id}`}>
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Gift size={24} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-snug">{reward.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{reward.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles size={10} className="text-amber-500" />
                          <span className="text-xs font-bold text-amber-600">{reward.pointsCost.toLocaleString()} diem</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={member.points >= reward.pointsCost ? "default" : "outline"}
                        disabled={member.points < reward.pointsCost || redeemReward.isPending}
                        onClick={() => handleRedeem(reward.id)}
                        className="shrink-0"
                        data-testid={`button-redeem-${reward.id}`}
                      >
                        Doi
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History */}
            <div>
              <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Lich Su Don Hang
              </h3>
              {!orders || orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package size={36} strokeWidth={1.2} className="mx-auto mb-2" />
                  <p className="text-sm">Chua co don hang nao</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...orders].reverse().map((order) => {
                    let items: Array<{ name: string; quantity: number; price: number }> = [];
                    try { items = JSON.parse(order.items); } catch {}
                    return (
                      <div key={order.id} className="bg-card border border-border rounded-xl p-3" data-testid={`order-item-${order.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Don #{order.id}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {items.slice(0, 2).map((item, i) => (
                                <span key={i} className="text-xs">{item.name}{item.quantity > 1 ? ` x${item.quantity}` : ""}{i < Math.min(items.length, 2) - 1 ? "," : ""}</span>
                              ))}
                              {items.length > 2 && <span className="text-xs text-muted-foreground">+{items.length - 2} mon</span>}
                            </div>
                          </div>
                          <Badge className={`text-[10px] shrink-0 ${statusColors[order.status] ?? ""}`} variant="secondary">
                            {statusLabels[order.status] ?? order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                          <span className="font-bold text-sm text-primary">{formatPrice(order.totalAmount)}</span>
                        </div>
                        {order.pointsEarned > 0 && (
                          <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                            <Sparkles size={10} /> +{order.pointsEarned} diem
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Redemption History */}
            {redemptions && redemptions.length > 0 && (
              <div>
                <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                  <Gift size={18} className="text-primary" />
                  Lich Su Doi Qua
                </h3>
                <div className="space-y-2">
                  {[...redemptions].reverse().map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3" data-testid={`redemption-${r.id}`}>
                      <div>
                        <p className="text-sm font-semibold">{r.rewardName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <span className="text-xs font-bold text-destructive">-{r.pointsUsed} diem</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!searchPhone && (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy size={64} strokeWidth={1} className="mx-auto mb-4 text-primary/30" />
            <h3 className="font-bold text-foreground text-lg">Kiem tra the thanh vien</h3>
            <p className="text-sm mt-1">Nhap so dien thoai de xem diem, doi qua va lich su don hang</p>
          </div>
        )}
      </div>
    </div>
  );
}
