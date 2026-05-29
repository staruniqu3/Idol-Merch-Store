import { useState, useEffect } from "react";
import { RefreshCw, LogOut, User } from "lucide-react";

type StaffCard = { id: string; name: string; token: string };
type StaffAssignment = {
  entryKey: string;
  productName: string;
  customerName: string;
  phone?: string;
  variant?: string;
  qty: number;
  staffId: string;
  assignedAt: string;
};

export default function StaffListPage() {
  const base = (import.meta.env.BASE_URL as string)?.replace(/\/$/, "") ?? "";
  const [token, setToken] = useState("");
  const [staff, setStaff] = useState<StaffCard | null>(() => {
    try { return JSON.parse(sessionStorage.getItem("staff_session") || "null"); } catch { return null; }
  });
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const fetchAssignments = async (staffId: string) => {
    setSyncing(true);
    try {
      const r = await fetch(`${base}/api/settings/admin_staff_assignments`, { cache: "no-store" });
      const data: StaffAssignment[] | null = await r.json();
      if (Array.isArray(data)) {
        setAssignments((data as StaffAssignment[]).filter((a) => a.staffId === staffId));
        setLastSync(new Date().toLocaleTimeString("vi-VN"));
      }
    } catch {}
    setSyncing(false);
  };

  const login = async () => {
    setError("");
    setSyncing(true);
    try {
      const r = await fetch(`${base}/api/settings/admin_staff_cards`, { cache: "no-store" });
      const cards: StaffCard[] | null = await r.json();
      if (!Array.isArray(cards)) { setError("Không thể kết nối server"); setSyncing(false); return; }
      const found = (cards as StaffCard[]).find((c) => c.token.toLowerCase() === token.trim().toLowerCase());
      if (!found) { setError("Thẻ không hợp lệ"); setSyncing(false); return; }
      setStaff(found);
      sessionStorage.setItem("staff_session", JSON.stringify(found));
      await fetchAssignments(found.id);
    } catch { setError("Lỗi kết nối"); }
    setSyncing(false);
  };

  useEffect(() => {
    if (!staff) return;
    fetchAssignments(staff.id);
    const id = setInterval(() => fetchAssignments(staff.id), 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff?.id]);

  const AUTO_LOGOUT_MS = 15 * 60 * 1000;

  const doLogout = () => {
    setStaff(null);
    setAssignments([]);
    setToken("");
    sessionStorage.removeItem("staff_session");
    sessionStorage.removeItem("staff_hidden_at");
  };

  // Auto sign-out: save timestamp when page hidden, check on return
  useEffect(() => {
    if (!staff) return;

    // On mount: check if previously hidden too long
    const hiddenAt = sessionStorage.getItem("staff_hidden_at");
    if (hiddenAt && Date.now() - Number(hiddenAt) > AUTO_LOGOUT_MS) {
      doLogout();
      return;
    }
    sessionStorage.removeItem("staff_hidden_at");

    const handleVisibility = () => {
      if (document.hidden) {
        sessionStorage.setItem("staff_hidden_at", String(Date.now()));
      } else {
        const t = sessionStorage.getItem("staff_hidden_at");
        if (t && Date.now() - Number(t) > AUTO_LOGOUT_MS) {
          doLogout();
        } else {
          sessionStorage.removeItem("staff_hidden_at");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff?.id]);

  const grouped = assignments.reduce((acc, a) => {
    if (!acc[a.productName]) acc[a.productName] = [];
    acc[a.productName].push(a);
    return acc;
  }, {} as Record<string, StaffAssignment[]>);

  if (!staff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <User size={26} className="text-primary" />
            </div>
            <p className="text-xl font-black">Staff Portal</p>
            <p className="text-sm text-muted-foreground">Nhập tên thẻ để xem đơn hàng của bạn</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Tên thẻ staff..."
              autoCapitalize="none"
              autoComplete="off"
              className="w-full border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-background transition-all"
            />
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <button
              type="button"
              onClick={login}
              disabled={syncing || !token.trim()}
              className="w-full bg-primary text-white font-bold rounded-2xl py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {syncing ? "Đang kiểm tra..." : "Vào xem"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalQty = assignments.reduce((s, a) => s + a.qty, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-12 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User size={16} className="text-primary" />
              </div>
              <p className="font-black text-base leading-tight">{staff.name}</p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 ml-10">
              {assignments.length} đơn · {totalQty} sản phẩm
              {lastSync && <> · sync {lastSync}</>}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchAssignments(staff.id)}
              disabled={syncing}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-border hover:bg-muted/40 transition-colors disabled:opacity-40"
              title="Sync thủ công"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin text-primary" : "text-muted-foreground"} />
            </button>
            <button
              type="button"
              onClick={() => { setStaff(null); setAssignments([]); setToken(""); sessionStorage.removeItem("staff_session"); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-border hover:bg-muted/40 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={13} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground italic">Chưa có đơn hàng nào được gán cho bạn</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tự động cập nhật mỗi 30 giây</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {Object.entries(grouped).map(([productName, items]) => {
              const groupQty = items.reduce((s, a) => s + a.qty, 0);
              // Group by variant within this product
              const byVariant = items.reduce((acc, a) => {
                const key = a.variant || "";
                if (!acc[key]) acc[key] = 0;
                acc[key] += a.qty;
                return acc;
              }, {} as Record<string, number>);
              const variants = Object.entries(byVariant).filter(([k]) => k !== "");
              return (
                <div key={productName} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-snug">{productName}</p>
                    {variants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {variants.map(([v, q]) => (
                          <span key={v} className="text-[9px] bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-full font-bold">
                            {v} ×{q}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{items.length} đơn</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-primary leading-none">{groupQty}</p>
                    <p className="text-[10px] text-muted-foreground">sản phẩm</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground/40 pt-2">
          Tự động sync mỗi 30 giây · Tiệm Chu Du
        </p>
      </div>
    </div>
  );
}
