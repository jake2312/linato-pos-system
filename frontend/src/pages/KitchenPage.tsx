import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { Order } from "../types";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";

export function KitchenPage() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({
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
      <Card>
        <h1 className="heading text-2xl">Kitchen Display</h1>
        <p className="text-sm text-slate-500">
          Real-time queue for prep and plating.
        </p>
      </Card>

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-6 h-10 w-full" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders?.map((order) => (
            <Card
              key={order.id}
              className={`border-2 ${
                isNewOrder(order.created_at)
                  ? "border-mango/60"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="heading text-lg">{order.receipt_number}</p>
                  <p className="text-xs text-slate-500">
                    {order.dine_type.replace("_", " ")} • {order.status}
                  </p>
                </div>
                <Badge tone="warning">
                  {order.items.length} items • {timeSince(order.created_at)}
                </Badge>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {order.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between">
                    <span>
                      {item.qty}x {item.name_snapshot}
                    </span>
                    <span className="text-slate-400">{item.notes}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button
                  tone="secondary"
                  size="lg"
                  onClick={() =>
                    updateStatus.mutate({
                      orderId: order.id,
                      status: "preparing",
                    })
                  }
                >
                  Preparing
                </Button>
                <Button
                  tone="primary"
                  size="lg"
                  onClick={() =>
                    updateStatus.mutate({ orderId: order.id, status: "ready" })
                  }
                >
                  Ready
                </Button>
              </div>
            </Card>
          ))}
          {!orders?.length && (
            <Card className="text-center text-sm text-slate-500">
              No active kitchen orders.
            </Card>
          )}
        </div>
      )}
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
