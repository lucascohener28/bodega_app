import React, { useState } from "react";
import logoPyl from "../../assets/logo.png";
import { apiFetch } from "../../lib/api";

type AuthUser = {
  id: string;
  nombre: string;
  username: string;
  email: string | null;
  rol: "ADMIN" | "CAJERO";
  activo: boolean;
  debeCambiarPassword: boolean;
};

type Props = {
  user: AuthUser;
  onPasswordChanged: (user: AuthUser) => void;
  onLogout: () => void;
};

export function ChangePasswordRequired({ user, onPasswordChanged, onLogout }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y la confirmación no coinciden");
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cambiar la contraseña");
      }

      onPasswordChanged(data.usuario);
    } catch (err: any) {
      setError(err.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(88,129,0,0.16),_transparent_34rem),linear-gradient(135deg,_#fbfcf8,_#f5f7ef_48%,_#ffffff)] p-4">
      <section className="w-full max-w-lg rounded-[30px] border border-brand-100 bg-white p-6 shadow-[0_25px_80px_rgba(47,70,0,0.12)]">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-500 bg-brand-700 p-2 shadow-lg shadow-brand-100">
            <img src={logoPyl} alt="Complejo Recreativo P y L" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
              Seguridad
            </p>
            <h1 className="text-2xl font-bold text-slate-950">Cambiar contraseña</h1>
            <p className="mt-1 text-sm text-slate-500">{user.nombre} · @{user.username}</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Para continuar, tenés que cambiar la contraseña temporal asignada por el administrador.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Contraseña actual</label>
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Nueva contraseña</label>
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Confirmar nueva contraseña</label>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              disabled={loading}
              className="flex-1 rounded-2xl bg-brand-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-100 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-2xl border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Salir
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
