import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import { formatPhp } from "../utils/format";
import type {
  Category,
  DiningTable,
  Order,
  OrderItem,
  PosSettings,
  Product,
} from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../providers/ToastProvider";
import { useConfirm } from "../providers/ConfirmProvider";

type CartItem = {
  product_id: number;
  name: string;
  price: number;
  qty: number;
  discount_amount: number;
  notes: string;
};

const dineTypes = [
  { value: "dine_in", label: "Dine-In" },
  { value: "takeout", label: "Takeout" },
  { value: "delivery", label: "Delivery" },
] as const;

export function PosPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [dineType, setDineType] = useState<"dine_in" | "takeout" | "delivery">(
    "dine_in"
  );
  const [tableId, setTableId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [serviceRate, setServiceRate] = useState(0);
  const [taxRate, setTaxRate] = useState(12);
  const [rounding, setRounding] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>("/categories?all=1");
      return response.data.data;
    },
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ all: "1" });
      if (search) params.set("q", search);
      if (categoryId) params.set("category_id", String(categoryId));
      const response = await api.get<{ data: Product[] }>(
        `/products?${params.toString()}`
      );
      return response.data.data;
    },
  });

  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await api.get<{ data: DiningTable[] }>("/tables?all=1");
      return response.data.data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-pos"],
    queryFn: async () => {
      const response = await api.get<{ data: { value: PosSettings } }>(
        "/settings/pos"
      );
      return response.data.data.value;
    },
  });

  useEffect(() => {
    if (settings) {
      setTaxRate(settings.tax_rate);
      setServiceRate(settings.service_charge_rate);
    }
  }, [settings]);

  const { data: heldOrders } = useQuery({
    queryKey: ["held-orders"],
    queryFn: async () => {
      const response = await api.get<{ data: Order[] }>("/orders?per_page=50");
      return response.data.data.filter((order) => order.held_at);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post<{ data: Order }>("/orders", payload);
      return response.data.data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["held-orders"] });
      setActiveOrderId(order.id);
      toast.success("Order created", {
        message: `Receipt ${order.receipt_number} saved.`,
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await api.patch<{ data: Order }>(`/orders/${id}`, payload);
      return response.data.data;
    },
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Order }>(`/orders/${id}/confirm`);
      return response.data.data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kds"] });
      toast.success("Order confirmed", {
        message: `Sent to kitchen: ${order.receipt_number}`,
      });
      setPaymentOpen(true);
    },
  });

  const holdOrderMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/orders/${id}/hold`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["held-orders"] }),
  });

  const resumeOrderMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/orders/${id}/resume`),
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (payload: {
      orderId: number;
      method: string;
      amount: number;
      reference_no?: string;
    }) => {
      const response = await api.post(`/orders/${payload.orderId}/payments`, {
        method: payload.method,
        amount: payload.amount,
        reference_no: payload.reference_no,
      });
      return response.data;
    },
  });

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const itemDiscount = cartItems.reduce(
      (sum, item) => sum + item.discount_amount,
      0
    );
    const net = Math.max(subtotal - itemDiscount - orderDiscount, 0);
    const serviceCharge = net * (serviceRate / 100);
    const taxAmount = net * (taxRate / 100);
    const total = net + serviceCharge + taxAmount + rounding;
    return { subtotal, itemDiscount, net, serviceCharge, taxAmount, total };
  }, [cartItems, orderDiscount, serviceRate, taxRate, rounding]);

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          qty: 1,
          discount_amount: 0,
          notes: "",
        },
      ];
    });
  };

  const updateItem = (productId: number, patch: Partial<CartItem>) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, ...patch } : item
      )
    );
  };

  const removeItem = async (productId: number) => {
    const ok = await confirm({
      title: "Remove item?",
      description: "This will remove the item from the cart.",
      confirmText: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const resetCart = () => {
    setCartItems([]);
    setActiveOrderId(null);
    setOrderDiscount(0);
    setCustomerName("");
    setPhone("");
    setAddress("");
    setTableId(null);
  };

  const buildPayload = () => ({
    dine_type: dineType,
    table_id: dineType === "dine_in" ? tableId : null,
    customer_name: dineType === "delivery" ? customerName : null,
    phone: dineType === "delivery" ? phone : null,
    address: dineType === "delivery" ? address : null,
    items: cartItems.map((item) => ({
      product_id: item.product_id,
      qty: item.qty,
      discount_amount: item.discount_amount,
      notes: item.notes,
    })),
    discount_amount: orderDiscount,
    service_charge_rate: serviceRate,
    tax_rate: taxRate,
    rounding,
    hold: false,
  });

  const submitOrder = async () => {
    const payload = buildPayload();
    if (!activeOrderId) {
      const order = await createOrderMutation.mutateAsync(payload);
      return order;
    }
    await updateOrderMutation.mutateAsync({ id: activeOrderId, payload });
    const response = await api.get<{ data: Order }>(`/orders/${activeOrderId}`);
    return response.data.data;
  };

  const handleConfirm = async () => {
    if (cartItems.length === 0) {
      toast.warning("Cart is empty", { message: "Add items to proceed." });
      return;
    }
    if (dineType === "dine_in" && !tableId) {
      toast.warning("Select a table", { message: "Table is required." });
      return;
    }
    if (dineType === "delivery" && (!customerName || !phone || !address)) {
      toast.warning("Missing delivery details", {
        message: "Name, phone, and address are required.",
      });
      return;
    }
    const order = await submitOrder();
    await confirmOrderMutation.mutateAsync(order.id);
  };

  const handleHold = async () => {
    if (cartItems.length === 0) {
      toast.warning("Cart is empty", { message: "Add items to hold." });
      return;
    }
    if (dineType === "dine_in" && !tableId) {
      toast.warning("Select a table", { message: "Table is required." });
      return;
    }
    if (dineType === "delivery" && (!customerName || !phone || !address)) {
      toast.warning("Missing delivery details", {
        message: "Name, phone, and address are required.",
      });
      return;
    }
    if (!activeOrderId) {
      const order = await createOrderMutation.mutateAsync({
        ...buildPayload(),
        hold: true,
      });
      toast.info("Order held", { message: order.receipt_number });
    } else {
      await holdOrderMutation.mutateAsync(activeOrderId);
      toast.info("Order held", { message: "Saved to held list." });
    }
    resetCart();
  };

  const loadHeldOrder = async (orderId: number) => {
    const response = await api.get<{ data: Order }>(`/orders/${orderId}`);
    const order = response.data.data;
    await resumeOrderMutation.mutateAsync(orderId);
    queryClient.invalidateQueries({ queryKey: ["held-orders"] });
    const itemDiscountTotal = order.items.reduce(
      (sum, item) => sum + Number(item.discount_amount),
      0
    );
    const orderLevelDiscount = Math.max(
      Number(order.discount_amount) - itemDiscountTotal,
      0
    );
    setActiveOrderId(order.id);
    setDineType(order.dine_type);
    setTableId(order.table_id ?? null);
    setCustomerName(order.customer_name ?? "");
    setPhone(order.phone ?? "");
    setAddress(order.address ?? "");
    setOrderDiscount(orderLevelDiscount);
    setServiceRate(order.service_charge_rate);
    setTaxRate(order.tax_rate);
    setRounding(order.rounding);
    setCartItems(
      order.items.map((item: OrderItem) => ({
        product_id: item.product_id,
        name: item.name_snapshot,
        price: Number(item.price),
        qty: item.qty,
        discount_amount: Number(item.discount_amount),
        notes: item.notes ?? "",
      }))
    );
    toast.success("Order resumed", { message: order.receipt_number });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <section className="space-y-4">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="heading text-2xl">POS Terminal</h1>
              <p className="text-sm text-slate-500">
                Search and tap items to build an order quickly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="info">Tax {taxRate}%</Badge>
              <Badge tone="warning">Service {serviceRate}%</Badge>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              label="Search"
              placeholder="Search products or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex items-end gap-2 overflow-x-auto pb-1">
              <Button
                tone={!categoryId ? "primary" : "secondary"}
                size="sm"
                onClick={() => setCategoryId(null)}
              >
                All
              </Button>
              {loadingCategories ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                categories?.map((category) => (
                  <Button
                    key={category.id}
                    tone={categoryId === category.id ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setCategoryId(category.id)}
                  >
                    {category.name}
                  </Button>
                ))
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {loadingProducts &&
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-32">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-3 h-4 w-28" />
                <Skeleton className="mt-6 h-5 w-16" />
              </Card>
            ))}
          {!loadingProducts &&
            products?.map((product) => (
              <button
                key={product.id}
                className="rounded-2xl bg-white p-4 text-left shadow-card transition hover:-translate-y-1 hover:shadow-lg"
                onClick={() => addToCart(product)}
              >
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-500">{product.sku}</p>
                <p className="mt-4 text-sm font-semibold text-basil">
                  {formatPhp(Number(product.price))}
                </p>
              </button>
            ))}
          {!loadingProducts && !products?.length && (
            <Card className="col-span-full text-center text-sm text-slate-500">
              No products found. Try another category.
            </Card>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <Card className="space-y-3">
          <h2 className="heading text-lg">Order Details</h2>
          <div className="flex flex-wrap gap-2">
            {dineTypes.map((type) => (
              <Button
                key={type.value}
                tone={dineType === type.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setDineType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
          {dineType === "dine_in" && (
            <label className="text-xs font-semibold uppercase text-slate-500">
              Table
              <select
                className="mt-1 w-full rounded-xl border-slate-200 text-sm"
                value={tableId ?? ""}
                onChange={(event) =>
                  setTableId(
                    event.target.value ? Number(event.target.value) : null
                  )
                }
              >
                <option value="">Select table</option>
                {tables?.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name} ({table.capacity} pax, {table.status})
                  </option>
                ))}
              </select>
            </label>
          )}
          {dineType === "delivery" && (
            <div className="grid gap-2">
              <Input
                label="Customer name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
              <Input
                label="Phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Input
                label="Address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="heading text-lg">Cart</h2>
            <Button tone="ghost" size="sm" onClick={resetCart}>
              Clear
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {cartItems.length === 0 && (
              <p className="text-sm text-slate-500">No items yet.</p>
            )}
            {cartItems.map((item) => (
              <div key={item.product_id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatPhp(item.price)}
                    </p>
                  </div>
                  <Button
                    tone="danger"
                    size="sm"
                    onClick={() => removeItem(item.product_id)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 rounded-xl border px-2 py-1">
                    <Button
                      tone="ghost"
                      size="sm"
                      onClick={() =>
                        updateItem(item.product_id, {
                          qty: Math.max(1, item.qty - 1),
                        })
                      }
                    >
                      -
                    </Button>
                    <input
                      type="number"
                      min={1}
                      className="w-full border-none text-center text-sm focus:ring-0"
                      value={item.qty}
                      onChange={(event) =>
                        updateItem(item.product_id, {
                          qty: Number(event.target.value),
                        })
                      }
                    />
                    <Button
                      tone="ghost"
                      size="sm"
                      onClick={() =>
                        updateItem(item.product_id, { qty: item.qty + 1 })
                      }
                    >
                      +
                    </Button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    className="rounded-lg border-slate-200 text-sm"
                    value={item.discount_amount}
                    onChange={(event) =>
                      updateItem(item.product_id, {
                        discount_amount: Number(event.target.value),
                      })
                    }
                    placeholder="Discount"
                  />
                  <input
                    className="rounded-lg border-slate-200 text-sm"
                    value={item.notes}
                    onChange={(event) =>
                      updateItem(item.product_id, { notes: event.target.value })
                    }
                    placeholder="Notes"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:sticky lg:top-6">
          <h2 className="heading text-lg">Totals</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Subtotal" value={formatPhp(totals.subtotal)} />
            <Row
              label="Item discounts"
              value={`-${formatPhp(totals.itemDiscount)}`}
            />
            <div className="flex items-center justify-between gap-2">
              <span>Order discount</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={orderDiscount}
                onChange={(event) => setOrderDiscount(Number(event.target.value))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Service charge %</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={serviceRate}
                onChange={(event) => setServiceRate(Number(event.target.value))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Tax %</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={taxRate}
                onChange={(event) => setTaxRate(Number(event.target.value))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Rounding</span>
              <input
                type="number"
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={rounding}
                onChange={(event) => setRounding(Number(event.target.value))}
              />
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPhp(totals.total)}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button tone="secondary" onClick={handleHold}>
              Hold Order
            </Button>
            <Button tone="primary" onClick={handleConfirm}>
              Confirm Order
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="heading text-lg">Held Orders</h2>
          <div className="mt-3 space-y-2">
            {heldOrders?.length ? (
              heldOrders.map((order) => (
                <button
                  key={order.id}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm"
                  onClick={() => loadHeldOrder(order.id)}
                >
                  <span>{order.receipt_number}</span>
                  <span className="text-slate-500">
                    {formatPhp(order.total)}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">No held orders.</p>
            )}
          </div>
        </Card>
      </section>

      {paymentOpen && activeOrderId && (
        <PaymentModal
          total={totals.total}
          onClose={() => setPaymentOpen(false)}
          onComplete={() => {
            setPaymentOpen(false);
            resetCart();
          }}
          onAddPayment={async (data) => {
            await addPaymentMutation.mutateAsync({
              orderId: activeOrderId,
              method: data.method,
              amount: data.amount,
              reference_no: data.reference_no,
            });
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PaymentModal({
  total,
  onClose,
  onComplete,
  onAddPayment,
}: {
  total: number;
  onClose: () => void;
  onComplete: () => void;
  onAddPayment: (data: {
    method: "cash" | "gcash" | "card";
    amount: number;
    reference_no?: string;
  }) => Promise<void>;
}) {
  const toast = useToast();
  const [method, setMethod] = useState<"cash" | "gcash" | "card">("cash");
  const [amount, setAmount] = useState(total);
  const [reference, setReference] = useState("");
  const [paid, setPaid] = useState(0);
  const [loading, setLoading] = useState(false);

  const remaining = Math.max(total - paid, 0);
  const change = method === "cash" ? Math.max(amount - remaining, 0) : 0;

  const handleAddPayment = async () => {
    if (amount <= 0) {
      toast.warning("Invalid amount", { message: "Enter a valid amount." });
      return;
    }
    setLoading(true);
    try {
      await onAddPayment({
        method,
        amount,
        reference_no: reference || undefined,
      });
      setPaid((prev) => prev + amount);
      setAmount(Math.max(total - (paid + amount), 0));
      setReference("");
      toast.success("Payment added", {
        message: `${formatPhp(amount)} via ${method}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      title="Collect Payment"
      description="Add one or more payments to settle the bill."
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            tone="primary"
            onClick={onComplete}
            disabled={remaining > 0}
          >
            Complete
          </Button>
        </>
      }
    >
      <div
        className="space-y-4"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleAddPayment();
          }
        }}
      >
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <Row label="Total" value={formatPhp(total)} />
          <Row label="Paid" value={formatPhp(paid)} />
          <Row label="Remaining" value={formatPhp(remaining)} />
          {change > 0 && (
            <Row label="Change" value={formatPhp(change)} />
          )}
        </div>
        <div className="flex gap-2">
          {(["cash", "gcash", "card"] as const).map((type) => (
            <Button
              key={type}
              tone={method === type ? "primary" : "secondary"}
              size="sm"
              onClick={() => setMethod(type)}
            >
              {type}
            </Button>
          ))}
        </div>
        <Input
          label="Amount tendered"
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
        {(method === "gcash" || method === "card") && (
          <Input
            label="Reference number"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        )}
        <Button onClick={handleAddPayment} loading={loading}>
          Add Payment
        </Button>
        {remaining <= 0 && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Payment complete. Click “Complete” to finish.
          </div>
        )}
      </div>
    </Modal>
  );
}
