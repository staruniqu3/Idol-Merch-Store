import { useListShippingUpdates } from "@workspace/api-client-react";
import { Truck, Package, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  preparing: {
    label: "Dang chuan bi",
    icon: <Clock size={16} />,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  in_transit: {
    label: "Dang van chuyen",
    icon: <Truck size={16} />,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  arrived: {
    label: "Da ve kho",
    icon: <Package size={16} />,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
  delivered: {
    label: "Da giao",
    icon: <CheckCircle size={16} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ShippingPage() {
  const { data: updates, isLoading } = useListShippingUpdates();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold">Lich Van Chuyen</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Cap nhat trang thai don hang moi nhat</p>
      </div>

      <div className="px-4 py-4 space-y-0">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 pb-6">
              <div className="flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-0.5 flex-1 mt-2" />
              </div>
              <div className="flex-1 pb-6 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}

        {!isLoading && (!updates || updates.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Truck size={56} strokeWidth={1.2} />
            <p className="font-semibold">Chua co cap nhat van chuyen</p>
            <p className="text-sm text-center">Shop se cap nhat lich van chuyen sớm</p>
          </div>
        )}

        {updates && [...updates].reverse().map((update, idx, arr) => {
          const config = statusConfig[update.status] ?? statusConfig.preparing;
          const isLast = idx === arr.length - 1;
          return (
            <div key={update.id} className="flex gap-4" data-testid={`shipping-update-${update.id}`}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${config.bg} ${config.color}`}>
                  {config.icon}
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-border mt-1 mb-0 min-h-[2rem]" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3 className="font-bold text-sm">{update.title}</h3>
                  <Badge variant="outline" className={`text-[10px] border ${config.bg} ${config.color} shrink-0`}>
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{update.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{formatDate(update.createdAt)}</span>
                  {update.estimatedDate && (
                    <>
                      <ArrowRight size={10} />
                      <span className="text-primary font-semibold">Du kien: {update.estimatedDate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
