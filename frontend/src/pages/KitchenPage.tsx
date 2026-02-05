import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { Order } from "../types";

export function KitchenPage() {
  const queryClient = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["kds"],
    queryFn: async () => {
      const response = await api.get<{ data: Order[] }>("/kds/orders");
      return response.data.data;
    },
    refetchInterval: 5000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: "preparing" | "ready";
    }) => {
      const response = await api.patch(`/kds/orders/${orderId}/status`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kds"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <h1 className="heading text-2xl">Kitchen Display</h1>
        <p className="text-sm text-slate-500">
          Real-time queue for prep and plating.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {orders?.map((order) => (
          <div
            key={order.id}
            className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-card ${
              isNewOrder(order.created_at) ? "ring-2 ring-mango" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="heading text-lg">{order.receipt_number}</p>
                <p className="text-xs text-slate-500">
                  {order.dine_type.replace("_", " ")} • {order.status}
                </p>
              </div>
              <span className="rounded-full bg-mango/10 px-3 py-1 text-xs font-semibold text-mango">
                {order.items.length} items • {timeSince(order.created_at)}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {order.items.map((item) => (
                <div key={item.product_id} className="flex justify-between">
                  <span>
                    {item.qty}x {item.name_snapshot}
                  </span>
                  <span>{item.notes}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold"
                onClick={() =>
                  updateStatus.mutate({ orderId: order.id, status: "preparing" })
                }
              >
                Preparing
              </button>
              <button
                className="rounded-xl bg-basil px-3 py-2 text-xs font-semibold text-white"
                onClick={() =>
                  updateStatus.mutate({ orderId: order.id, status: "ready" })
                }
              >
                Ready
              </button>
            </div>
          </div>
        ))}
        {!orders?.length && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-card">
            No active kitchen orders.
          </div>
        )}
      </div>
    </div>
  );
}

function timeSince(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

function isNewOrder(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  return diffMs < 5 * 60 * 1000;
}
