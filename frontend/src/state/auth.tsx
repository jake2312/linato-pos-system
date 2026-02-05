import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../utils/api";

export type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "linato_token";
const USER_KEY = "linato_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const login = async (email: string, password: string) => {
    const response = await api.post(
      "/auth/login",
      { email, password },
      { skipToast: true }
    );
    const nextToken = response.data.token as string;
    const nextUser = response.data.user as User;

    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
