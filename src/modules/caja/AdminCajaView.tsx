import { useCallback, useEffect, useMemo, useState } from "react";
import {
  abrirCaja,
  cerrarCaja,
  crearMovimientoCaja,
  getCajaDetalle,
  getCajaEstado,
  getCajaHistorial,
} from "../../lib/api";
import type {
  CajaDetalle,
  CajaEstado,
  CajaHistorialItem,
  CajaResumenActual,
  CierreCajaResumen,
} from "../../lib/api";

const formatGs = (value?: number | null) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-PY", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

function DifferenceBadge({ value }: { value?: number | null }) {
  const amount = value || 0;
  const tone =
    amount === 0
      ? "bg-slate-100 text-slate-700"
      : amount > 0
        ? "bg-brand-100 text-brand-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {amount === 0 ? "Correcto" : amount > 0 ? "Sobrante" : "Faltante"} · {formatGs(amount)}
    </span>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <article className="flex min-h-[112px] flex-col justify-between rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">{label}</p>
      <div className="mt-3">
        <h3 className="break-words text-lg font-bold text-slate-950 sm:text-xl">{value}</h3>
        {helper && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{helper}</p>}
      </div>
    </article>
  );
}

export function AdminCajaView() {
  const [caja, setCaja] = useState<CajaEstado | null>(null);
  const [resumen, setResumen] = useState<CajaResumenActual | null>(null);
  const [historial, setHistorial] = useState<CajaHistorialItem[]>([]);
  const [detalle, setDetalle] = useState<CajaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cierreResumen, setCierreResumen] = useState<CierreCajaResumen | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("TODOS");
  const [apertura, setApertura] = useState({ montoInicial: "", observacion: "" });
  const [cierre, setCierre] = useState({ montoFinal: "", observacion: "" });
  const [movimiento, setMovimiento] = useState({
    tipo: "INGRESO" as "INGRESO" | "EGRESO" | "RETIRO",
    monto: "",
    concepto: "",
    observacion: "",
  });

  const loadData = useCallback(async () => {
    const [estadoData, historialData] = await Promise.all([
      getCajaEstado(),
      getCajaHistorial(),
    ]);

    setCaja(estadoData.caja);
    setResumen(estadoData.resumen);
    setHistorial(historialData);
  }, []);

  useEffect(() => {
    loadData().catch(() => setError("No se pudo cargar la administración de caja"));
  }, [loadData]);

  const cajaAbierta = caja?.estado === "ABIERTA";
  const usuarios = useMemo(
    () =>
      Array.from(new Set(historial.map((item) => item.abiertaPor?.username).filter(Boolean))),
    [historial]
  );
  const historialFiltrado = historial.filter((item) => {
    const matchesEstado = estadoFiltro === "TODOS" || item.estado === estadoFiltro;
    const matchesUsuario = usuarioFiltro === "TODOS" || item.abiertaPor?.username === usuarioFiltro;
    const matchesFecha = !fechaFiltro || item.fecha.slice(0, 10) === fechaFiltro;
    return matchesEstado && matchesUsuario && matchesFecha;
  });

  async function runAction(action: () => Promise<void>, message: string) {
    setError(null);
    setSuccess(null);
    setCierreResumen(null);

    try {
      await action();
      setSuccess(message);
      await loadData();
    } catch (err: any) {
      setError(err.message || "No se pudo completar la acción");
    }
  }

  async function handleAbrir(event: React.FormEvent) {
    event.preventDefault();
    await runAction(
      async () => {
        await abrirCaja({
          montoInicial: Number(apertura.montoInicial),
          observacion: apertura.observacion,
        });
        setApertura({ montoInicial: "", observacion: "" });
      },
      "Caja abierta correctamente"
    );
  }

  async function handleCerrar(event: React.FormEvent) {
    event.preventDefault();
    await runAction(
      async () => {
        const response = await cerrarCaja({
          montoFinal: Number(cierre.montoFinal),
          observacion: cierre.observacion,
        });
        setCierreResumen(response.resumen);
        setCierre({ montoFinal: "", observacion: "" });
      },
      "Caja cerrada correctamente"
    );
  }

  async function handleMovimiento(tipo?: "INGRESO" | "EGRESO" | "RETIRO") {
    await runAction(
      async () => {
        await crearMovimientoCaja({
          ...movimiento,
          tipo: tipo || movimiento.tipo,
          monto: Number(movimiento.monto),
        });
        setMovimiento({ tipo: "INGRESO", monto: "", concepto: "", observacion: "" });
      },
      "Movimiento registrado"
    );
  }

  async function openDetalle(id: string) {
    try {
      setDetalle(await getCajaDetalle(id));
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el detalle de caja");
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-sm sm:tracking-[0.22em]">
          Administración de caja
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
          Caja
        </h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Control de caja actual, historial, diferencias y auditoría.
        </p>
      </section>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">{success}</div>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Estado" value={caja?.estado || "CERRADA"} helper={cajaAbierta ? "Caja operativa" : "Sin caja abierta"} />
        <SummaryCard label="Monto inicial" value={formatGs(caja?.montoInicial)} helper={caja?.abiertaPor?.nombre || "Sin responsable"} />
        <SummaryCard label="Efectivo" value={formatGs(resumen?.ventasEfectivo)} helper="Ventas del día" />
        <SummaryCard label="Esperado" value={formatGs(resumen?.totalEsperado)} helper="Efectivo esperado" />
        <SummaryCard label="Ingresos" value={formatGs(resumen?.ingresosCaja)} helper="Movimientos manuales" />
        <SummaryCard label="Apertura" value={formatDateTime(caja?.abiertaEn)} helper={caja?.abiertaPor?.username || "-"} />
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-950">Acciones rápidas</h3>
            <p className="mt-1 text-sm text-slate-500">Abrí, cerrá y registrá movimientos sin salir de la pantalla.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <button disabled={cajaAbierta} form="abrir-caja-admin" className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300">Abrir caja</button>
            <button disabled={!cajaAbierta} form="cerrar-caja-admin" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">Cerrar caja</button>
            <button disabled={!cajaAbierta} onClick={() => handleMovimiento("INGRESO")} className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50">Ingreso</button>
            <button disabled={!cajaAbierta} onClick={() => handleMovimiento("EGRESO")} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50">Egreso</button>
            <button disabled={!cajaAbierta} onClick={() => handleMovimiento("RETIRO")} className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Retiro</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <form id="abrir-caja-admin" onSubmit={handleAbrir} className="space-y-3 rounded-2xl bg-slate-50 p-4">
            <h4 className="font-bold text-slate-950">Abrir caja</h4>
            <input disabled={cajaAbierta} type="number" min="0" required placeholder="Monto inicial" value={apertura.montoInicial} onChange={(event) => setApertura({ ...apertura, montoInicial: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60" />
            <input disabled={cajaAbierta} placeholder="Observación apertura" value={apertura.observacion} onChange={(event) => setApertura({ ...apertura, observacion: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60" />
          </form>

          <form id="cerrar-caja-admin" onSubmit={handleCerrar} className="space-y-3 rounded-2xl bg-slate-50 p-4">
            <h4 className="font-bold text-slate-950">Cerrar caja</h4>
            <input disabled={!cajaAbierta} type="number" min="0" required placeholder="Monto contado" value={cierre.montoFinal} onChange={(event) => setCierre({ ...cierre, montoFinal: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60" />
            <input disabled={!cajaAbierta} placeholder="Observación cierre" value={cierre.observacion} onChange={(event) => setCierre({ ...cierre, observacion: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60" />
          </form>

          <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
            <h4 className="font-bold text-slate-950">Movimiento manual</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <select disabled={!cajaAbierta} value={movimiento.tipo} onChange={(event) => setMovimiento({ ...movimiento, tipo: event.target.value as any })} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60">
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
                <option value="RETIRO">Retiro</option>
              </select>
              <input disabled={!cajaAbierta} type="number" min="1" placeholder="Monto" value={movimiento.monto} onChange={(event) => setMovimiento({ ...movimiento, monto: event.target.value })} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60" />
            </div>
            <input disabled={!cajaAbierta} placeholder="Concepto requerido" value={movimiento.concepto} onChange={(event) => setMovimiento({ ...movimiento, concepto: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60" />
            <input disabled={!cajaAbierta} placeholder="Observación" value={movimiento.observacion} onChange={(event) => setMovimiento({ ...movimiento, observacion: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-300 disabled:opacity-60" />
          </div>
        </div>
      </section>

      {cajaAbierta && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <h3 className="text-xl font-bold text-slate-950">Caja abierta actual</h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p><strong>ID:</strong> {caja?.cajaId}</p>
              <p><strong>Abierta por:</strong> {caja?.abiertaPor?.nombre}</p>
              <p><strong>Hora apertura:</strong> {formatDateTime(caja?.abiertaEn)}</p>
              <p><strong>Monto inicial:</strong> {formatGs(caja?.montoInicial)}</p>
              <p><strong>Movimientos:</strong> {caja?.movimientos?.length || 0}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard label="Efectivo" value={formatGs(resumen?.ventasEfectivo)} />
              <SummaryCard label="Esperado" value={formatGs(resumen?.totalEsperado)} />
            </div>
          </div>
        </section>
      )}

      {cierreResumen && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <h3 className="text-xl font-bold text-slate-950">Último cierre</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard label="Esperado" value={formatGs(cierreResumen.totalEsperado)} />
            <SummaryCard label="Contado" value={formatGs(cierreResumen.montoFinal)} />
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Diferencia</p>
              <div className="mt-3"><DifferenceBadge value={cierreResumen.diferencia} /></div>
            </div>
            <SummaryCard label="Efectivo ventas" value={formatGs(cierreResumen.ventasEfectivo)} />
          </div>
        </section>
      )}

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-950">Historial de cajas</h3>
            <p className="mt-1 text-sm text-slate-500">Todas las cajas registradas, con diferencias y responsables.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input type="date" value={fechaFiltro} onChange={(event) => setFechaFiltro(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-300" />
            <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-300">
              <option value="TODOS">Todos</option>
              <option value="ABIERTA">Abierta</option>
              <option value="CERRADA">Cerrada</option>
            </select>
            <select value={usuarioFiltro} onChange={(event) => setUsuarioFiltro(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-300">
              <option value="TODOS">Todos los usuarios</option>
              {usuarios.map((username) => <option key={username} value={username}>{username}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
            <thead className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th>Fecha</th><th>Estado</th><th>Abierta por</th><th>Cerrada por</th><th>Inicial</th><th>Final</th><th>Esperado</th><th>Diferencia</th><th></th>
              </tr>
            </thead>
            <tbody>
              {historialFiltrado.map((item) => (
                <tr key={item.id} className="bg-slate-50 text-sm">
                  <td className="rounded-l-2xl px-4 py-4">{formatDateTime(item.fecha)}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.estado === "ABIERTA" ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"}`}>{item.estado}</span></td>
                  <td className="px-4 py-4">{item.abiertaPor?.nombre}</td>
                  <td className="px-4 py-4">{item.cerradaPor?.nombre || "-"}</td>
                  <td className="px-4 py-4 font-semibold">{formatGs(item.montoInicial)}</td>
                  <td className="px-4 py-4">{formatGs(item.montoFinal)}</td>
                  <td className="px-4 py-4">{formatGs(item.totalEsperado)}</td>
                  <td className="px-4 py-4"><DifferenceBadge value={item.diferencia} /></td>
                  <td className="rounded-r-2xl px-4 py-4 text-right"><button onClick={() => openDetalle(item.id)} className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-700">Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 space-y-3 lg:hidden">
          {historialFiltrado.map((item) => (
            <button key={item.id} onClick={() => openDetalle(item.id)} className="w-full rounded-2xl bg-slate-50 p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950">{formatDateTime(item.fecha)}</p>
                  <p className="mt-1 text-sm text-slate-500">Abierta por {item.abiertaPor?.nombre}</p>
                </div>
                <DifferenceBadge value={item.diferencia} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {detalle && (
        <section className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/45 p-4">
          <div className="mx-auto my-8 max-w-5xl rounded-[28px] bg-white p-5 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Detalle de caja</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">{formatDateTime(detalle.caja.fecha)}</h3>
                <p className="mt-1 text-sm text-slate-500">ID {detalle.caja.id}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold">Cerrar</button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <SummaryCard label="Inicial" value={formatGs(detalle.caja.montoInicial)} />
              <SummaryCard label="Final" value={formatGs(detalle.caja.montoFinal)} />
              <SummaryCard label="Esperado" value={formatGs(detalle.resumen.totalEsperado)} />
              <div className="rounded-[22px] border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Diferencia</p><div className="mt-3"><DifferenceBadge value={detalle.resumen.diferencia} /></div></div>
              <SummaryCard label="Efectivo" value={formatGs(detalle.resumen.ventasEfectivo)} />
              <SummaryCard label="QR" value={formatGs(detalle.resumen.ventasQR)} />
              <SummaryCard label="Transferencia" value={formatGs(detalle.resumen.ventasTransferencia)} />
              <SummaryCard label="Mixto" value={formatGs(detalle.resumen.ventasMixto)} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <h4 className="font-bold text-slate-950">Auditoría</h4>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p><strong>Abrió:</strong> {detalle.caja.abiertaPor?.nombre} · {formatDateTime(detalle.caja.abiertaEn)}</p>
                  <p><strong>Cerró:</strong> {detalle.caja.cerradaPor?.nombre || "-"} · {formatDateTime(detalle.caja.cerradaEn)}</p>
                  <p><strong>Obs. apertura:</strong> {detalle.caja.observacionApertura || "-"}</p>
                  <p><strong>Obs. cierre:</strong> {detalle.caja.observacionCierre || "-"}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <h4 className="font-bold text-slate-950">Movimientos manuales</h4>
                <div className="mt-3 space-y-2">
                  {detalle.caja.movimientos.map((mov) => (
                    <div key={mov.id} className="rounded-xl bg-white px-3 py-2 text-sm">
                      <p className="font-semibold text-slate-950">{mov.tipo} · {formatGs(mov.monto)}</p>
                      <p className="text-slate-500">{mov.concepto} · {mov.creadoPor.nombre} · {formatDateTime(mov.createdAt)}</p>
                    </div>
                  ))}
                  {detalle.caja.movimientos.length === 0 && <p className="text-sm text-slate-500">Sin movimientos manuales.</p>}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <h4 className="font-bold text-slate-950">Ventas del turno</h4>
              <div className="mt-3 space-y-2">
                {detalle.ventas.map((venta) => (
                  <div key={venta.id} className="rounded-xl bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-950">Venta #{venta.id} · {formatGs(venta.total)} · {venta.metodoPago}</p>
                    <p className="text-slate-500">{venta.productos.map((p) => `${p.cantidad} ${p.nombre}`).join(" + ") || "Sin detalle"}</p>
                  </div>
                ))}
                {detalle.ventas.length === 0 && <p className="text-sm text-slate-500">Sin ventas asociadas.</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
