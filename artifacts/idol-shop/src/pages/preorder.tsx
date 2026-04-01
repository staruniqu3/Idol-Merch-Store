import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle, ChevronRight, X, Star, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PreorderItem {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  imageUrl: string | null;
  artist: string | null;
  isActive: boolean;
  createdAt: string;
}

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function DeadlineBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0) return (
    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Đã kết thúc</span>
  );
  if (days === 0) return (
    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse-soft">HÔM NAY</span>
  );
  if (days <= 3) return (
    <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Còn {days} ngày</span>
  );
  if (days <= 7) return (
    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Còn {days} ngày</span>
  );
  return (
    <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Còn {days} ngày</span>
  );
}

function PreorderModal({ item, onClose }: { item: PreorderItem; onClose: () => void }) {
  const days = getDaysLeft(item.deadline);
  const ended = days !== null && days < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hero-gradient p-5 pt-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-pink-300" fill="currentColor" />
            <span className="text-xs font-semibold text-pink-200">{item.artist ?? "Pre-order"}</span>
          </div>
          <h3 className="text-xl font-bold leading-tight">{item.title}</h3>
        </div>

        <div className="p-5 space-y-4">
          {item.description && (
            <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
          )}

          {item.deadline && (
            <div className={`rounded-2xl p-4 ${ended ? "bg-gray-50" : days !== null && days <= 3 ? "bg-red-50" : "bg-primary/10"}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className={ended ? "text-gray-400" : "text-primary"} />
                <span className="text-xs font-bold text-muted-foreground">DEADLINE ĐẶT HÀNG</span>
              </div>
              <p className={`text-lg font-black ${ended ? "text-gray-400" : "text-primary"}`}>
                {new Date(item.deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              {days !== null && days >= 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {days === 0 ? "Hôm nay là ngày cuối!" : `Còn ${days} ngày để đặt hàng`}
                </p>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm hover:bg-muted/80 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreorderPage() {
  const [items, setItems] = useState<PreorderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<PreorderItem | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");

  useEffect(() => {
    const base = getBaseUrl();
    setIsLoading(true);
    fetch(`${base}/api/preorder-schedule`)
      .then((r) => r.json())
      .then((data) => { setItems(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = items.filter((i) => {
    if (filter === "active") return i.isActive;
    return true;
  }).sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-10 pb-8 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Lịch Pre-order</h1>
            <p className="text-xs opacity-70 mt-0.5">Theo dõi deadline đặt hàng</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{activeCount}</p>
            <p className="text-[10px] opacity-70 font-semibold">Đang mở</p>
          </div>
          <div className="flex gap-2">
            {(["active", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f ? "bg-white text-foreground" : "bg-white/15 text-white/80"
                }`}
              >
                {f === "active" ? "Đang mở" : "Tất cả"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 -mt-2 space-y-3">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        }

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Package size={36} strokeWidth={1.2} />
            </div>
            <p className="font-bold text-foreground">Chưa có pre-order</p>
            <p className="text-sm text-center">Shop sẽ thông báo khi có goods mới</p>
          </div>
        )}

        {filtered.map((item) => {
          const days = getDaysLeft(item.deadline);
          const ended = days !== null && days < 0;
          const urgent = days !== null && days >= 0 && days <= 3;

          return (
            <button
              key={item.id}
              className={`w-full bg-card border rounded-2xl p-4 text-left card-hover shadow-sm transition-all active:scale-[0.98] ${
                urgent ? "border-red-200 ring-1 ring-red-100" : ended ? "border-border opacity-60" : "border-border"
              }`}
              onClick={() => setSelected(item)}
              data-testid={`preorder-card-${item.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${
                  ended ? "bg-gray-100" : urgent ? "bg-red-100" : "bg-primary/10"
                }`}>
                  <Calendar size={20} className={ended ? "text-gray-400" : urgent ? "text-red-500" : "text-primary"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {item.artist && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.artist}</span>
                    )}
                    <DeadlineBadge days={days} />
                  </div>
                  <p className="font-bold text-sm leading-snug">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  {item.deadline && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={11} className="text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Deadline: {new Date(item.deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>

      {selected && <PreorderModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
