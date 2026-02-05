import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { formatPhp } from "../utils/format";
import type { DiningTable, Order } from "../types";

export function OrdersPage() {
  const [status, setStatus] = useState("");
  const [receipt, setReceipt] = useState("");
  const [tableId, setTableId] = useState("");

  const { data: tables } = useQuery({
    queryKey: ["orders-tables"],
    queryFn: async () => {
      const response = await api.get<{ data: DiningTable[] }>("/tables?all=1");
      return response.data.data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", status, receipt, tableId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (receipt) params.set("receipt_number", receipt);
      if (tableId) params.set("table_id", tableId);
      const response = await api.get<{ data: Order[] }>(
        `/orders?${params.toString()}`
      );
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="heading text-2xl">Orders</h1>
            <p className="text-sm text-slate-500">Track and manage tickets.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="rounded-xl border-slate-200"
              placeholder="Search receipt"
              value={receipt}
              onChange={(event) => setReceipt(event.target.value)}
            />
            <select
              className="rounded-xl border-slate-200"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="rounded-xl border-slate-200"
              value={tableId}
              onChange={(event) => setTableId(event.target.value)}
            >
              <option value="">All tables</option>
              {tables?.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {orders?.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl bg-white p-4 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="heading text-lg">{order.receipt_number}</p>
                <p className="text-xs text-slate-500">
                  {order.dine_type.replace("_", " ")} • {order.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatPhp(order.total)}</p>
                <p className="text-xs text-slate-500">
                  Balance {formatPhp(order.balance)}
                </p>
                <Link
                  className="mt-2 inline-block rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                  to={`/receipt/${order.id}`}
                  target="_blank"
                >
                  Print
                </Link>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              {order.items.map((item) => (
                <div key={item.product_id} className="flex justify-between">
                  <span>
                    {item.qty}x {item.name_snapshot}
                  </span>
                  <span>{formatPhp(Number(item.line_total))}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!orders?.length && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-card">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}
