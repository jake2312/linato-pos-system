import type { ReactNode } from "react";
import { useAuth } from "../state/auth";

export function RoleGate({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const allowed = roles.some((role) => user.roles.includes(role));

  if (!allowed) {
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-2xl bg-white p-6 text-center shadow-card">
        <h2 className="heading text-xl">Access restricted</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your account does not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
