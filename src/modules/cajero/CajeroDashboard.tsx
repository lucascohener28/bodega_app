import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, ShoppingCart, Wallet } from "lucide-react";
import { getCajeroDashboard } from "../../lib/api";
import type { CajeroDashboardData } from "../../lib/api";

type Props = {
  onNavigate: (key: "ventas" | "caja" | "stock" | "movimientos") => void;
};

const formatGs = (value: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("es-PY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof ShoppingCart;
}) {
  return (
    <article className="flex h-full flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        {value}
      </h3>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

export function CajeroDashboard({ onNavigate }: Props) {
  const [data, setData] = useState<CajeroDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setData(await getCajeroDashboard());
      } catch {
        setError("No se pudo cargar el dashboard del cajero");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600">
          Caja operativa
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Cargando dashboard...
        </h2>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-[28px] border border-red-100 bg-red-50 p-6 text-red-700">
        {error || "No hay datos disponibles"}
      </section>
    );
  }

  const cajaAbierta = data.caja.estado === "ABIERTA";

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-sm sm:tracking-[0.22em]">
            Panel operativo
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            Dashboard Cajero
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Resumen del día sin ganancias, costos ni datos sensibles.
          </p>
        </div>
        <button
          onClick={() => onNavigate("caja")}
          className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-100 transition hover:bg-brand-700"
        >
          {cajaAbierta ? "Gestionar caja" : "Abrir caja"}
        </button>
      </section>

      {!cajaAbierta && (
        <section className="flex items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-bold">Caja cerrada</h3>
            <p className="mt-1 text-sm">
              Abra caja para control diario. Las ventas no se bloquean, pero el cierre no tendrá apertura registrada.
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard title="Ventas hoy" value={formatGs(data.ventasHoy)} helper="Total vendido del día" icon={ShoppingCart} />
        <StatCard title="Cantidad" value={`${data.cantidadVentasHoy}`} helper="Ventas realizadas" icon={CreditCard} />
        <StatCard title="Caja" value={data.caja.estado} helper={cajaAbierta ? "Caja abierta" : "Caja cerrada"} icon={Wallet} />
        <StatCard title="Efectivo" value={formatGs(data.metodosPago.efectivo)} helper="Cobrado en efectivo" icon={Wallet} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <h3 className="text-xl font-bold text-slate-950">Métodos de pago</h3>
          <div className="mt-5 space-y-3">
            {[
              ["Efectivo", data.metodosPago.efectivo],
              ["QR", data.metodosPago.qr],
              ["Transferencia", data.metodosPago.transferencia],
              ["Mixto", data.metodosPago.mixto],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">{label}</span>
                <span className="font-bold text-slate-950">{formatGs(Number(value))}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-slate-950">Últimas ventas</h3>
            <button onClick={() => onNavigate("ventas")} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Nueva venta
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {data.ultimasVentas.map((venta) => {
              const productos = venta.productos
                .slice(0, 3)
                .map((producto) => `${producto.cantidad} ${producto.nombre}`)
                .join(" + ");

              return (
                <div key={venta.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">Venta #{venta.id}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {productos || "Sin detalle"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Pago: {venta.metodoPago} · Hora: {formatTime(venta.fecha)}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-slate-950">{formatGs(venta.total)}</p>
                  </div>
                </div>
              );
            })}
            {data.ultimasVentas.length === 0 && (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Todavía no hay ventas registradas hoy.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
