import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { formatPhp } from "../utils/format";
import type { DiningTable, Order } from "../types";
import { Card } from "../components/ui/Card";
import { Badge, type BadgeTone } from "../components/ui/Badge";
import { Table } from "../components/ui/Table";
import { Skeleton } from "../components/ui/Skeleton";

const statusTone = (status: string): BadgeTone => {
  if (status === "ready") return "success";
  if (status === "preparing") return "warning";
  if (status === "cancelled") return "danger";
  if (status === "confirmed") return "info";
  return "neutral";
};

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

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="heading text-2xl">Orders</h1>
            <p className="text-sm text-slate-500">Track and manage tickets.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="rounded-xl border-slate-200 text-sm"
              placeholder="Search receipt"
              value={receipt}
              onChange={(event) => setReceipt(event.target.value)}
            />
            <select
              className="rounded-xl border-slate-200 text-sm"
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
              className="rounded-xl border-slate-200 text-sm"
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
      </Card>

      {isLoading && (
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      )}

      {isError && (
        <Card className="text-center text-sm text-slate-500">
          <p>Unable to load orders right now.</p>
          <button className="mt-2 text-basil underline" onClick={() => refetch()}>
            Retry
          </button>
        </Card>
      )}

      {!isLoading && !isError && orders && orders.length > 0 && (
        <Table>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">
                  {order.receipt_number}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {order.dine_type.replace("_", " ")}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {formatPhp(order.total)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-500">
                  {formatPhp(order.balance)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    to={`/receipt/${order.id}`}
                    target="_blank"
                  >
                    Print
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {!isLoading && !isError && orders && orders.length === 0 && (
        <Card className="text-center text-sm text-slate-500">
          No orders found. Try adjusting the filters.
        </Card>
      )}
    </div>
  );
}
