import { useCallback, useEffect, useState } from "react";
import {
  abrirCaja,
  cerrarCaja,
  crearMovimientoCaja,
  getCajaEstado,
} from "../../lib/api";
import type { CajaEstado, CierreCajaResumen } from "../../lib/api";

const formatGs = (value: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("es-PY", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

export function CajeroCajaView() {
  const [caja, setCaja] = useState<CajaEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cierreResumen, setCierreResumen] = useState<CierreCajaResumen | null>(null);
  const [apertura, setApertura] = useState({ montoInicial: "", observacion: "" });
  const [movimiento, setMovimiento] = useState({
    tipo: "EGRESO" as "INGRESO" | "EGRESO" | "RETIRO",
    monto: "",
    concepto: "",
    observacion: "",
  });
  const [cierre, setCierre] = useState({ montoFinal: "", observacion: "" });

  const loadEstado = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCajaEstado();
      setCaja(response.caja);
    } catch {
      setError("No se pudo cargar el estado de caja");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstado();
  }, [loadEstado]);

  async function handleAbrir(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCierreResumen(null);

    try {
      await abrirCaja({
        montoInicial: Number(apertura.montoInicial),
        observacion: apertura.observacion,
      });
      setSuccess("Caja abierta correctamente");
      setApertura({ montoInicial: "", observacion: "" });
      await loadEstado();
    } catch (err: any) {
      setError(err.message || "No se pudo abrir caja");
    }
  }

  async function handleMovimiento(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await crearMovimientoCaja({
        tipo: movimiento.tipo,
        monto: Number(movimiento.monto),
        concepto: movimiento.concepto,
        observacion: movimiento.observacion,
      });
      setSuccess("Movimiento registrado");
      setMovimiento({ tipo: "EGRESO", monto: "", concepto: "", observacion: "" });
      await loadEstado();
    } catch (err: any) {
      setError(err.message || "No se pudo registrar movimiento");
    }
  }

  async function handleCerrar(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCierreResumen(null);

    try {
      const response = await cerrarCaja({
        montoFinal: Number(cierre.montoFinal),
        observacion: cierre.observacion,
      });
      setSuccess("Caja cerrada correctamente");
      setCierreResumen(response.resumen);
      setCierre({ montoFinal: "", observacion: "" });
      await loadEstado();
    } catch (err: any) {
      setError(err.message || "No se pudo cerrar caja");
    }
  }

  const cajaAbierta = caja?.estado === "ABIERTA";

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-sm sm:tracking-[0.22em]">
          Operación diaria
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
          Caja Diaria
        </h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Apertura, movimientos manuales y cierre del efectivo del día.
        </p>
      </section>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">{success}</div>}

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Estado actual</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              {loading ? "Cargando..." : cajaAbierta ? "Caja abierta" : "Caja cerrada"}
            </h3>
            {cajaAbierta && (
              <p className="mt-2 text-sm text-slate-500">
                Inicial {formatGs(caja?.montoInicial || 0)} · Abierta {formatDateTime(caja?.abiertaEn)} · {caja?.abiertaPor?.nombre}
              </p>
            )}
          </div>
          <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${cajaAbierta ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"}`}>
            {caja?.estado || "CERRADA"}
          </span>
        </div>
      </section>

      {!cajaAbierta ? (
        <form onSubmit={handleAbrir} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <h3 className="text-xl font-bold text-slate-950">Abrir caja</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <input
              type="number"
              min="0"
              required
              placeholder="Monto inicial"
              value={apertura.montoInicial}
              onChange={(event) => setApertura({ ...apertura, montoInicial: event.target.value })}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white"
            />
            <input
              placeholder="Observación opcional"
              value={apertura.observacion}
              onChange={(event) => setApertura({ ...apertura, observacion: event.target.value })}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white"
            />
            <button className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              Abrir caja
            </button>
          </div>
        </form>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={handleMovimiento} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <h3 className="text-xl font-bold text-slate-950">Movimiento manual</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <select
                value={movimiento.tipo}
                onChange={(event) => setMovimiento({ ...movimiento, tipo: event.target.value as any })}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white"
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
                <option value="RETIRO">Retiro</option>
              </select>
              <input type="number" min="1" required placeholder="Monto" value={movimiento.monto} onChange={(event) => setMovimiento({ ...movimiento, monto: event.target.value })} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white" />
              <input required placeholder="Concepto" value={movimiento.concepto} onChange={(event) => setMovimiento({ ...movimiento, concepto: event.target.value })} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white" />
              <input placeholder="Observación" value={movimiento.observacion} onChange={(event) => setMovimiento({ ...movimiento, observacion: event.target.value })} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white" />
            </div>
            <button className="mt-4 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              Guardar movimiento
            </button>
          </form>

          <form onSubmit={handleCerrar} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <h3 className="text-xl font-bold text-slate-950">Cerrar caja</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-[220px_1fr]">
              <input type="number" min="0" required placeholder="Monto contado" value={cierre.montoFinal} onChange={(event) => setCierre({ ...cierre, montoFinal: event.target.value })} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white" />
              <input placeholder="Observación de cierre" value={cierre.observacion} onChange={(event) => setCierre({ ...cierre, observacion: event.target.value })} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-300 focus:bg-white" />
            </div>
            <button className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Cerrar caja
            </button>
          </form>
        </section>
      )}

      {cierreResumen && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <h3 className="text-xl font-bold text-slate-950">Resumen de cierre</h3>
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="min-h-[112px] rounded-2xl bg-slate-50 p-3 sm:p-4"><p className="text-xs text-slate-500 sm:text-sm">Esperado efectivo</p><p className="mt-2 break-words text-lg font-bold sm:text-xl">{formatGs(cierreResumen.totalEsperado)}</p></div>
            <div className="min-h-[112px] rounded-2xl bg-slate-50 p-3 sm:p-4"><p className="text-xs text-slate-500 sm:text-sm">Contado</p><p className="mt-2 break-words text-lg font-bold sm:text-xl">{formatGs(cierreResumen.montoFinal)}</p></div>
            <div className={`min-h-[112px] rounded-2xl p-3 sm:p-4 ${cierreResumen.diferencia === 0 ? "bg-brand-50 text-brand-700" : cierreResumen.diferencia < 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
              <p className="text-xs sm:text-sm">Diferencia</p>
              <p className="mt-2 break-words text-lg font-bold sm:text-xl">{formatGs(cierreResumen.diferencia)}</p>
            </div>
            <div className="min-h-[112px] rounded-2xl bg-slate-50 p-3 sm:p-4"><p className="text-xs text-slate-500 sm:text-sm">Estado</p><p className="mt-2 text-lg font-bold sm:text-xl">{cierreResumen.diferencia === 0 ? "Correcto" : cierreResumen.diferencia < 0 ? "Faltante" : "Sobrante"}</p></div>
          </div>
        </section>
      )}
    </div>
  );
}
