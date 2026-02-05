import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGate } from "./components/RoleGate";
import { LoginPage } from "./pages/LoginPage";
import { PosPage } from "./pages/PosPage";
import { OrdersPage } from "./pages/OrdersPage";
import { KitchenPage } from "./pages/KitchenPage";
import { AdminPage } from "./pages/AdminPage";
import { ReceiptPage } from "./pages/ReceiptPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/receipt/:id" element={<ReceiptPage />} />

        <Route element={<AppShell />}>
          <Route
            path="/pos"
            element={
              <RoleGate roles={["admin", "cashier"]}>
                <PosPage />
              </RoleGate>
            }
          />
          <Route
            path="/orders"
            element={
              <RoleGate roles={["admin", "cashier"]}>
                <OrdersPage />
              </RoleGate>
            }
          />
          <Route
            path="/kitchen"
            element={
              <RoleGate roles={["admin", "kitchen"]}>
                <KitchenPage />
              </RoleGate>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleGate roles={["admin"]}>
                <AdminPage />
              </RoleGate>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
}

export default App;
