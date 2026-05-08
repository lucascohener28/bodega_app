export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "")
).replace(/\/$/, "");

const TOKEN_KEY = "pyl_auth_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event("auth:expired"));
  }

  return response;
}

export async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await apiFetch(endpoint);

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export type CajaEstado = {
  estado: "ABIERTA" | "CERRADA";
  cajaId?: string;
  montoInicial?: number;
  abiertaEn?: string;
  abiertaPor?: {
    id: string;
    nombre: string;
    username: string;
  };
  movimientos?: MovimientoCaja[];
};

export type CajaResumenActual = {
  ventasEfectivo: number;
  ventasQR: number;
  ventasTransferencia: number;
  ventasMixto: number;
  ingresosCaja: number;
  egresosCaja: number;
  retirosCaja: number;
  totalEsperado: number | null;
};

export type MovimientoCaja = {
  id: string;
  cajaId: string;
  tipo: "INGRESO" | "EGRESO" | "RETIRO";
  monto: number;
  concepto: string;
  observacion?: string | null;
  creadoPorId: string;
  createdAt: string;
};

export type CajeroDashboardData = {
  ventasHoy: number;
  cantidadVentasHoy: number;
  metodosPago: {
    efectivo: number;
    qr: number;
    transferencia: number;
    mixto: number;
  };
  caja: CajaEstado;
  ultimasVentas: Array<{
    id: number;
    fecha: string;
    total: number;
    metodoPago: string;
    productos: Array<{
      nombre: string;
      cantidad: number;
      subtotal: number;
    }>;
  }>;
};

export type CierreCajaResumen = {
  montoInicial: number;
  montoFinal: number;
  ventasEfectivo: number;
  ventasQR: number;
  ventasTransferencia: number;
  ventasMixto: number;
  ingresosCaja: number;
  egresosCaja: number;
  retirosCaja: number;
  totalEsperado: number;
  diferencia: number;
};

export type CajaHistorialItem = {
  id: string;
  fecha: string;
  estado: "ABIERTA" | "CERRADA";
  montoInicial: number;
  montoFinal: number | null;
  totalEfectivo: number;
  totalQR: number;
  totalTransferencia: number;
  totalMixto: number;
  totalEsperado: number | null;
  diferencia: number | null;
  observacionApertura: string | null;
  observacionCierre: string | null;
  abiertaEn: string;
  cerradaEn: string | null;
  abiertaPor: {
    nombre: string;
    username: string;
  };
  cerradaPor: {
    nombre: string;
    username: string;
  } | null;
};

export type CajaDetalle = {
  caja: CajaHistorialItem & {
    abiertaPorId: string;
    cerradaPorId: string | null;
    movimientos: Array<MovimientoCaja & {
      creadoPor: {
        id: string;
        nombre: string;
        username: string;
      };
    }>;
  };
  resumen: CierreCajaResumen;
  ventas: Array<{
    id: number;
    fecha: string;
    total: number;
    metodoPago: string;
    productos: Array<{
      nombre: string;
      cantidad: number;
      subtotal: number;
    }>;
  }>;
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }

  return data;
}

export async function getCajeroDashboard() {
  return fetchJson<CajeroDashboardData>("/cajero/dashboard");
}

export async function getCajaEstado() {
  return fetchJson<{ caja: CajaEstado; resumen: CajaResumenActual }>("/caja/estado");
}

export async function abrirCaja(payload: {
  montoInicial: number;
  observacion?: string;
}) {
  const response = await apiFetch("/caja/abrir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readApiResponse<{ message: string; caja: CajaEstado }>(response);
}

export async function cerrarCaja(payload: {
  montoFinal: number;
  observacion?: string;
}) {
  const response = await apiFetch("/caja/cerrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readApiResponse<{ message: string; resumen: CierreCajaResumen }>(response);
}

export async function crearMovimientoCaja(payload: {
  tipo: "INGRESO" | "EGRESO" | "RETIRO";
  monto: number;
  concepto: string;
  observacion?: string;
}) {
  const response = await apiFetch("/caja/movimientos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readApiResponse<{ message: string; movimiento: MovimientoCaja }>(response);
}

export async function getCajaHistorial() {
  return fetchJson<CajaHistorialItem[]>("/caja/historial");
}

export async function getCajaDetalle(id: string) {
  return fetchJson<CajaDetalle>(`/caja/${id}`);
}
