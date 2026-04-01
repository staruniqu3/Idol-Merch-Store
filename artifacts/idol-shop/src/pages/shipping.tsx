import { useState } from "react";
import { useListShippingUpdates } from "@workspace/api-client-react";
import { Truck, Package, CheckCircle, Clock, ChevronRight, X, MapPin, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  dot: string;
  gradient: string;
}> = {
  preparing: {
    label: "Đang chuẩn bị",
    icon: <Clock size={18} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
    gradient: "from-amber-400 to-orange-500",
  },
  in_transit: {
    label: "Đang vận chuyển",
    icon: <Truck size={18} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-500",
  },
  arrived: {
    label: "Đã về kho",
    icon: <Package size={18} />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-purple-600",
  },
  delivered: {
    label: "Đã giao",
    icon: <CheckCircle size={18} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateFull(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });
}

type Update = {
  id: number;
  title: string;
  description: string;
  status: string;
  estimatedDate: string | null;
  createdAt: string;
};

function ShippingModal({ update, onClose }: { update: Update; onClose: () => void }) {
  const config = statusConfig[update.status] ?? statusConfig.preparing;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${config.gradient} p-5 pt-6`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {config.icon}
            </div>
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

export default function ShippingPage() {
  const { data: updates, isLoading } = useListShippingUpdates();
  const [selected, setSelected] = useState<Update | null>(null);

  const sorted = updates ? [...updates].reverse() : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-10 pb-8 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Truck size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Lịch Vận Chuyển</h1>
            <p className="text-xs opacity-70 mt-0.5">Cập nhật tình trạng mới nhất</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className={`shrink-0 flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5`}>
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[11px] font-semibold whitespace-nowrap">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 -mt-2">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Truck size={36} strokeWidth={1.2} />
            </div>
            <p className="font-bold text-foreground">Chưa có cập nhật</p>
            <p className="text-sm text-center">Shop sẽ cập nhật lịch vận chuyển sớm</p>
          </div>
        )}

        <div className="space-y-3">
          {sorted.map((update, idx) => {
            const config = statusConfig[update.status] ?? statusConfig.preparing;
            const isFirst = idx === 0;
            return (
              <button
                key={update.id}
                className={`w-full bg-card border border-border rounded-2xl p-4 text-left card-hover shadow-sm transition-all active:scale-[0.98] ${isFirst ? "ring-2 ring-primary/20" : ""}`}
                onClick={() => setSelected(update as Update)}
                data-testid={`shipping-card-${update.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {isFirst && (
                        <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">MỚI NHẤT</span>
                      )}
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

      {selected && <ShippingModal update={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
