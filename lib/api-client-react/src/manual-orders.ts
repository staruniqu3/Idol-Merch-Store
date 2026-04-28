import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type ManualOrderItem = { name: string; qty: number; price: number; variant?: string };
export type ManualOrder = {
  id: string; customerName: string; phone: string;
  items: ManualOrderItem[]; note: string; date: string; status: string;
  createdAt?: string;
};

export const MANUAL_ORDERS_QUERY_KEY = ["/api/manual-orders"] as const;

export const listManualOrders = (): Promise<ManualOrder[]> =>
  customFetch<ManualOrder[]>("/api/manual-orders", { method: "GET" });

export const useListManualOrders = () =>
  useQuery({ queryKey: MANUAL_ORDERS_QUERY_KEY, queryFn: listManualOrders });

export const createManualOrder = (body: Omit<ManualOrder, "createdAt">): Promise<ManualOrder> =>
  customFetch<ManualOrder>("/api/manual-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const useCreateManualOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createManualOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: MANUAL_ORDERS_QUERY_KEY }),
  });
};

export const updateManualOrder = ({ id, ...body }: Partial<ManualOrder> & { id: string }): Promise<ManualOrder> =>
  customFetch<ManualOrder>(`/api/manual-orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const useUpdateManualOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateManualOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: MANUAL_ORDERS_QUERY_KEY }),
  });
};

export const deleteManualOrder = (id: string): Promise<{ ok: boolean }> =>
  customFetch<{ ok: boolean }>(`/api/manual-orders/${id}`, { method: "DELETE" });

export const useDeleteManualOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteManualOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: MANUAL_ORDERS_QUERY_KEY }),
  });
};
