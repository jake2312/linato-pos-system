import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../providers/ToastProvider";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("admin@linato.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back", { message: "You're signed in." });
      navigate("/pos");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linen px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card">
        <h1 className="heading text-2xl">Linato POS</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to manage orders and kitchen operations.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <div className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-xs text-slate-500">
          Demo accounts: admin@linato.com / cashier@linato.com / kitchen@linato.com
        </div>
      </div>
    </div>
  );
}
