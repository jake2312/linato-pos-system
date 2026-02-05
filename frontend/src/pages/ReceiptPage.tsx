import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { formatPhp } from "../utils/format";
import type { Order } from "../types";

export function ReceiptPage() {
  const { id } = useParams();

  const { data: order } = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const response = await api.get<{ data: Order }>(`/orders/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (order) {
      setTimeout(() => window.print(), 300);
    }
  }, [order]);

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading receipt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8 text-sm text-ink print:p-0">
      <div className="mx-auto max-w-sm">
        <div className="text-center">
          <h1 className="heading text-xl">Linato</h1>
          <p className="text-xs text-slate-500">Official Receipt</p>
        </div>
        <div className="mt-4 border-t border-b py-2 text-xs">
          <div className="flex justify-between">
            <span>Receipt</span>
            <span>{order.receipt_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span>{order.status}</span>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.product_id} className="flex justify-between">
              <span>
                {item.qty}x {item.name_snapshot}
              </span>
              <span>{formatPhp(Number(item.line_total))}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t pt-3 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPhp(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span>Discounts</span>
            <span>-{formatPhp(Number(order.discount_amount))}</span>
          </div>
          <div className="flex justify-between">
            <span>Service</span>
            <span>{formatPhp(Number(order.service_charge_amount))}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPhp(Number(order.tax_amount))}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Total</span>
            <span>{formatPhp(Number(order.total))}</span>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Thank you for dining with Linato.
        </p>
      </div>
    </div>
  );
}
