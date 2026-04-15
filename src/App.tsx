import { generarPDFLiquidacion } from "./lib/pdf";
import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Boxes,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { fetchJson } from "./lib/api";

type ModuleKey =
  | "dashboard"
  | "ventas"
  | "productos"
  | "categorias"
  | "stock"
  | "ingresos"
  | "proveedores"
  | "liquidaciones"
  | "reportes"
  | "usuarios"
  | "configuracion";

type NavItem = {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type ProveedorOption = {
  id: number;
  nombre: string;
};

type IngresoItemForm = {
  id: number;
  productoId: number | "";
  cantidad: number;
  costoUnitario: number;
};

type DashboardResumenResponse = {
  resumen: {
    totalVentasHoy: number;
    totalVentasMes: number;
    cantidadProductos: number;
    cantidadProductosBajoStock: number;
    deudaProveedores: number;
  };
  productosBajoStock: Array<{
    id: number;
    nombre: string;
    codigo: string;
    stockActual: number;
    stockMinimo: number;
    proveedor?: {
      nombre: string;
    };
  }>;
  ultimasVentas: Array<{
    id: number;
    fecha: string;
    total: number;
    metodoPago: string;
  }>;
  productosMasVendidos: Array<{
    productoId: number;
    nombre: string;
    codigo: string;
    cantidadVendida: number;
    totalVendido: number;
  }>;
};

type ProductoVenta = {
  id: number;
  nombre: string;
  codigo: string;
  precioVenta: number;
  costoProveedor: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  manejaPack: boolean;
  unidadesPorPack: number | null;
  categoria: {
    id: number;
    nombre: string;
  };
  proveedor: {
    id: number;
    nombre: string;
  };
};

type CartItem = {
  id: number;
  name: string;
  unitPrice: number;
  qty: number;
  stock: number;
};

type LiquidacionDetalle = {
  productoId: number;
  nombreProducto: string;
  cantidadIngresada: number;
  cantidadVendida: number;
  stockActual: number;
  costoUnitario: number;
  subtotalPagar: number;
};

type LiquidacionResumen = {
  proveedor: { id: number; nombre: string };
  periodo: string;
  detalles: LiquidacionDetalle[];
  totalGeneral: number;
};

type CategoriaOption = {
  id: number;
  nombre: string;
};

function formatGs(value: number) {
  return `Gs. ${value.toLocaleString("es-PY")}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPackBreakdown(unidades: number, unidadesPorPack: number | null) {
  if (!unidadesPorPack || unidadesPorPack <= 0) {
    return "—";
  }

  const packsCompletos = Math.floor(unidades / unidadesPorPack);
  const unidadesSueltas = unidades % unidadesPorPack;

  if (packsCompletos === 0 && unidadesSueltas === 0) {
    return "0 packs";
  }

  if (unidadesSueltas === 0) {
    return `${packsCompletos} pack${packsCompletos === 1 ? "" : "s"}`;
  }

  if (packsCompletos === 0) {
    return `${unidadesSueltas} u.`;
  }

  return `${packsCompletos} pack${packsCompletos === 1 ? "" : "s"} + ${unidadesSueltas} u.`;
}

function getPackMetrics(params: {
  cantidadIngresada: number;
  cantidadVendida: number;
  stockActual: number;
  manejaPack: boolean;
  unidadesPorPack: number | null;
}) {
  const {
    cantidadIngresada,
    cantidadVendida,
    stockActual,
    manejaPack,
    unidadesPorPack,
  } = params;

  if (!manejaPack || !unidadesPorPack || unidadesPorPack <= 0) {
    return {
      packLabel: "Por unidad",
      packsIngresados: "—",
      packsALiquidar: "—",
      unidadesLiquidadas: `${cantidadVendida} u.`,
      packsRestantes: "—",
      liquidacionPack: "Por unidad",
      stockPack: "—",
    };
  }

  const packsALiquidarNumero = Math.ceil(cantidadVendida / unidadesPorPack);
  const unidadesLiquidadasNumero = packsALiquidarNumero * unidadesPorPack;

  const packsALiquidar = `${packsALiquidarNumero} pack${
    packsALiquidarNumero === 1 ? "" : "s"
  }`;

  const unidadesLiquidadas = `${unidadesLiquidadasNumero} u.`;
  const packsIngresados = formatPackBreakdown(cantidadIngresada, unidadesPorPack);
  const packsRestantes = formatPackBreakdown(stockActual, unidadesPorPack);

  return {
    packLabel: `${unidadesPorPack} u.`,
    packsIngresados,
    packsALiquidar,
    unidadesLiquidadas,
    packsRestantes,
    liquidacionPack: `${packsALiquidar} / ${unidadesLiquidadas}`,
    stockPack: packsRestantes,
  };
}

const navigation: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "ventas", label: "Ventas", icon: ShoppingCart },
  { key: "productos", label: "Productos", icon: Package },
  { key: "categorias", label: "Categorías", icon: Boxes },
  { key: "stock", label: "Stock", icon: ClipboardList },
  { key: "ingresos", label: "Ingresos de mercadería", icon: Truck },
  { key: "proveedores", label: "Proveedores", icon: Wallet },
  { key: "liquidaciones", label: "Liquidaciones", icon: CreditCard },
  { key: "reportes", label: "Reportes", icon: FileBarChart2 },
  { key: "usuarios", label: "Usuarios", icon: Users },
  { key: "configuracion", label: "Configuración", icon: Settings },
];

function Sidebar({
  active,
  onChange,
}: {
  active: ModuleKey;
  onChange: (key: ModuleKey) => void;
}) {
  return (
    <aside className="w-[280px] shrink-0 rounded-[30px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">La Bodega</h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-500">
            Administración
          </p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto h-8 w-1 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex min-w-[320px] flex-1 items-center gap-4">
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar productos, ventas o proveedores..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
          />
        </div>

        <div className="hidden items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 xl:flex">
          Gestión de Bodega
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">
            LC
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Lucas Cohener</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-base text-slate-500">{description}</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5"
          >
            <div className="mb-4 h-11 w-11 rounded-2xl bg-blue-100" />
            <div className="h-4 w-32 rounded-full bg-slate-200" />
            <div className="mt-3 h-3 w-48 rounded-full bg-slate-100" />
            <div className="mt-2 h-3 w-40 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  helper,
  tone = "blue",
}: {
  title: string;
  value: string;
  helper: string;
  tone?: "blue" | "green" | "red" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div
        className={`mb-4 inline-flex rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${tones[tone]}`}
      >
        {title}
      </div>
      <h3 className="text-4xl font-bold tracking-tight text-slate-950">
        {value}
      </h3>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function DashboardView() {
  const [data, setData] = useState<DashboardResumenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchJson<DashboardResumenResponse>(
          "/dashboard/resumen"
        );
        setData(response);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
          Panel principal
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          Cargando dashboard...
        </h2>
        <p className="mt-3 text-slate-500">
          Estamos trayendo los datos reales del sistema.
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-white p-8 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">
          Error
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          No se pudo cargar el dashboard
        </h2>
        <p className="mt-3 text-slate-500">
          Verifica que el backend esté corriendo en http://localhost:3001.
        </p>
      </section>
    );
  }

  const { resumen, productosBajoStock, ultimasVentas, productosMasVendidos } =
    data;

  const weeklyData = [42, 65, 51, 74, 60, 88, 57];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Panel principal
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Resumen General
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">
            Bienvenido de nuevo. Aquí tienes lo más importante del día en la
            bodega.
          </p>
        </div>

        <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
          Nueva venta
        </button>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas del día"
          value={formatGs(resumen.totalVentasHoy)}
          helper="Datos reales del día actual"
          tone="blue"
        />
        <StatCard
          title="Ventas del mes"
          value={formatGs(resumen.totalVentasMes)}
          helper="Acumulado real del mes"
          tone="green"
        />
        <StatCard
          title="Deuda proveedores"
          value={formatGs(resumen.deudaProveedores)}
          helper="Liquidaciones abiertas pendientes"
          tone="red"
        />
        <StatCard
          title="Alerta de stock"
          value={`${resumen.cantidadProductosBajoStock} ítems`}
          helper="Productos que requieren reposición"
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-950">
                Tendencia Semanal
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Vista visual provisional del comportamiento semanal
              </p>
            </div>

            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
              Últimos 7 días
            </button>
          </div>

          <div className="flex h-80 items-end justify-between gap-3 rounded-[24px] bg-slate-50 p-5">
            {weeklyData.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-56 w-full items-end rounded-2xl bg-white p-2">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-blue-600 to-blue-400"
                    style={{ height: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-950">Más vendidos</h3>
            <p className="mt-1 text-sm text-slate-500">
              Productos con mejor rotación real
            </p>
          </div>

          <div className="space-y-4">
            {productosMasVendidos.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay ventas registradas.
              </p>
            ) : (
              productosMasVendidos.slice(0, 5).map((item, index) => (
                <div
                  key={item.productoId}
                  className="flex items-center gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {item.nombre}
                    </p>
                    <p className="text-sm text-slate-500">{item.codigo}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                      {item.cantidadVendida}
                    </p>
                    <p className="text-xs font-medium text-emerald-600">
                      ventas
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-950">Ventas recientes</h3>
            <p className="mt-1 text-sm text-slate-500">
              Últimas transacciones procesadas en la bodega
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-2">ID transacción</th>
                  <th className="pb-2">Fecha y hora</th>
                  <th className="pb-2">Monto total</th>
                  <th className="pb-2">Método</th>
                </tr>
              </thead>
              <tbody>
                {ultimasVentas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500"
                    >
                      No hay ventas registradas todavía.
                    </td>
                  </tr>
                ) : (
                  ultimasVentas.map((sale) => (
                    <tr key={sale.id} className="rounded-2xl bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-900">
                        V-{sale.id}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDateTime(sale.fecha)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {formatGs(sale.total)}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {sale.metodoPago}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-950">
              Productos por acabarse
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Stock en o por debajo del mínimo configurado
            </p>
          </div>

          <div className="space-y-4">
            {productosBajoStock.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay alertas de stock por ahora.
              </p>
            ) : (
              productosBajoStock.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.nombre}</p>
                      <p className="text-sm text-slate-500">{item.codigo}</p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Bajo stock
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Stock actual: {item.stockActual}
                    </span>
                    <span className="font-medium text-slate-700">
                      Mínimo: {item.stockMinimo}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}



function SalesView() {
  const [products, setProducts] = useState<ProductoVenta[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("EFECTIVO");
  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [cart, setCart] = useState<CartItem[]>([]);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setErrorProducts(null);

      const response = await fetchJson<ProductoVenta[]>("/productos");
      const activos = response.filter((product) => product.activo);
      setProducts(activos);
    } catch (err) {
      console.error(err);
      setErrorProducts("No se pudieron cargar los productos");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const payments = ["Efectivo", "Transferencia", "QR", "Mixto"];

  const categories = [
    "TODAS",
    ...Array.from(new Set(products.map((product) => product.categoria.nombre))),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "TODAS" ||
      product.categoria.nombre === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  function addToCart(product: ProductoVenta) {
    setSaleError(null);
    setSaleSuccess(null);

    if (product.stockActual <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        if (existing.qty >= existing.stock) {
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.nombre,
          unitPrice: product.precioVenta,
          qty: 1,
          stock: product.stockActual,
        },
      ];
    });
  }

  function increaseQty(productId: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;
        if (item.qty >= item.stock) return item;

        return { ...item, qty: item.qty + 1 };
      })
    );
  }

  function decreaseQty(productId: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  async function handleConfirmSale() {
    try {
      if (cart.length === 0) {
        setSaleError("Agrega al menos un producto antes de confirmar la venta");
        setSaleSuccess(null);
        return;
      }

      setSubmittingSale(true);
      setSaleError(null);
      setSaleSuccess(null);

      const response = await fetch("http://localhost:3001/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metodoPago: selectedPayment,
          observacion: "",
          detalles: cart.map((item) => ({
            productoId: item.id,
            cantidad: item.qty,
            precioUnitario: item.unitPrice,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar la venta");
      }

      setCart([]);
      setSelectedPayment("EFECTIVO");
      setSaleError(null);
      setSaleSuccess("Venta registrada correctamente");

      await loadProducts();
    } catch (err: any) {
      console.error(err);
      setSaleSuccess(null);
      setSaleError(err.message || "No se pudo registrar la venta");
    } finally {
      setSubmittingSale(false);
    }
  }

  const totalGeneral = cart.reduce(
    (acc, item) => acc + item.unitPrice * item.qty,
    0
  );

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.82fr]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Operación diaria
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Nueva Venta
          </h2>
          <p className="mt-2 text-slate-500">
            Pantalla rápida de mostrador para registrar ventas de la bodega.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos por nombre o código..."
            className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:bg-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "TODAS" ? "Todas las categorías" : category}
              </option>
            ))}
          </select>
        </div>

        {loadingProducts && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Cargando productos...
          </div>
        )}

        {errorProducts && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
            {errorProducts}
          </div>
        )}

        {!loadingProducts && !errorProducts && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No hay productos que coincidan con la búsqueda o el filtro.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stockActual <= 0}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    product.stockActual <= 0
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {product.categoria.nombre}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        product.stockActual <= 0
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {product.stockActual <= 0
                        ? "Sin stock"
                        : `Stock: ${product.stockActual}`}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">
                    {product.nombre}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">{product.codigo}</p>

                  <p className="mt-3 text-2xl font-bold tracking-tight text-blue-700">
                    {formatGs(product.precioVenta)}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Resumen
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Venta actual
            </h3>
          </div>

          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Caja abierta
          </span>
        </div>

        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
              Aún no agregaste productos a la venta.
            </div>
          ) : (
            cart.map((item) => {
              const subtotal = item.unitPrice * item.qty;

              return (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatGs(item.unitPrice)} por unidad
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      x{item.qty}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
                      >
                        -
                      </button>
                      <button
                        onClick={() => increaseQty(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-lg font-bold text-slate-950">
                      {formatGs(subtotal)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Método de pago
          </p>

          <div className="grid grid-cols-2 gap-3">
            {payments.map((payment) => {
              const paymentValue = payment.toUpperCase();

              return (
                <button
                  key={payment}
                  onClick={() => setSelectedPayment(paymentValue)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    selectedPayment === paymentValue
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {payment}
                </button>
              );
            })}
          </div>

          {saleError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {saleError}
            </div>
          )}

          {saleSuccess && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saleSuccess}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Total general
          </p>
          <h3 className="mt-2 text-5xl font-bold tracking-tight">
            {formatGs(totalGeneral)}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            {totalItems} productos en la venta actual
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            onClick={handleConfirmSale}
            disabled={submittingSale}
            className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingSale ? "Guardando venta..." : "Confirmar venta"}
          </button>

          <button
            onClick={() => {
              setCart([]);
              setSaleError(null);
              setSaleSuccess(null);
              setSelectedPayment("EFECTIVO");
            }}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar venta
          </button>
        </div>
      </section>
    </div>
  );
}

function StockView() {
  const [products, setProducts] = useState<ProductoVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchJson<ProductoVenta[]>("/productos");
        setProducts(response);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el stock");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const criticalCount = products.filter(
    (item) => item.stockActual <= Math.floor(item.stockMinimo * 0.7)
  ).length;

  const lowStockCount = products.filter(
    (item) =>
      item.stockActual > Math.floor(item.stockMinimo * 0.7) &&
      item.stockActual <= item.stockMinimo
  ).length;

  const inventoryValue = products.reduce(
    (acc, item) => acc + item.stockActual * item.precioVenta,
    0
  );

  const getStatus = (currentStock: number, minStock: number) => {
    if (currentStock <= Math.floor(minStock * 0.7)) {
      return {
        label: "Crítico",
        className: "bg-red-100 text-red-700",
      };
    }

    if (currentStock <= minStock) {
      return {
        label: "Bajo",
        className: "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "Óptimo",
      className: "bg-emerald-100 text-emerald-700",
    };
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Inventario
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Gestión de Stock
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">
            Control general del inventario, alertas de reposición y visión rápida
            del estado actual.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Exportar
          </button>
          <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            Ajustar stock
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[24px] border border-red-100 bg-red-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            Stock crítico
          </p>
          <h3 className="mt-4 text-5xl font-bold tracking-tight text-red-700">
            {String(criticalCount).padStart(2, "0")}
          </h3>
          <p className="mt-2 text-sm text-red-500">Requiere acción inmediata</p>
        </div>

        <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Stock bajo
          </p>
          <h3 className="mt-4 text-5xl font-bold tracking-tight text-amber-700">
            {String(lowStockCount).padStart(2, "0")}
          </h3>
          <p className="mt-2 text-sm text-amber-600">Programar reposición</p>
        </div>

        <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Valor inventario
          </p>
          <h3 className="mt-4 text-4xl font-bold tracking-tight text-emerald-700">
            {formatGs(inventoryValue)}
          </h3>
          <p className="mt-2 text-sm text-emerald-600">
            Estimación actual del stock
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Buscar producto..."
              className="h-12 min-w-[240px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
            />
            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              Todos los proveedores
            </button>
          </div>

          <span className="text-sm font-medium text-slate-500">
            {products.length} productos encontrados
          </span>
        </div>

        {loading && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Cargando stock...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Proveedor</th>
                <th className="pb-2">Stock actual</th>
                <th className="pb-2">Stock mínimo</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => {
                const status = getStatus(item.stockActual, item.stockMinimo);

                return (
                  <tr key={item.id} className="rounded-2xl bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.nombre}</p>
                        <p className="text-sm text-slate-500">
                          Código: {item.codigo}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {item.proveedor?.nombre ?? "Sin proveedor"}
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.stockActual}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {item.stockMinimo}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Ajustar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ProductsView() {
  const [products, setProducts] = useState<ProductoVenta[]>([]);
  const [categories, setCategories] = useState<CategoriaOption[]>([]);
  const [providers, setProviders] = useState<ProveedorOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    nombre: "",
    codigo: "",
    precioVenta: "",
    costoProveedor: "",
    stockMinimo: "",
    categoriaId: "",
    proveedorId: "",
    activo: true,
    manejaPack: false,
    unidadesPorPack: "",
  });

  const [editProduct, setEditProduct] = useState({
    id: 0,
    nombre: "",
    codigo: "",
    precioVenta: "",
    costoProveedor: "",
    stockMinimo: "",
    categoriaId: "",
    proveedorId: "",
    activo: true,
    manejaPack: false,
    unidadesPorPack: "",
  });

  async function loadProductsData() {
    try {
      setLoading(true);
      setError(null);

      const [productsResponse, categoriesResponse, providersResponse] =
        await Promise.all([
          fetchJson<ProductoVenta[]>("/productos"),
          fetchJson<CategoriaOption[]>("/categorias"),
          fetchJson<ProveedorOption[]>("/proveedores"),
        ]);

      setProducts(productsResponse);
      setCategories(categoriesResponse);
      setProviders(providersResponse);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductsData();
  }, []);

  const categoryOptions = [
    "TODAS",
    ...Array.from(new Set(products.map((product) => product.categoria.nombre))),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "TODAS" ||
      product.categoria.nombre === selectedCategory;

    const matchesStatus =
      selectedStatus === "TODOS" ||
      (selectedStatus === "ACTIVO" && product.activo) ||
      (selectedStatus === "INACTIVO" && !product.activo);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  async function handleCreateProduct() {
    try {
      if (
        !newProduct.nombre.trim() ||
        !newProduct.codigo.trim() ||
        newProduct.precioVenta === "" ||
        newProduct.costoProveedor === "" ||
        newProduct.categoriaId === "" ||
        newProduct.proveedorId === ""
      ) {
        setCreateError("Completa todos los campos obligatorios");
        setCreateSuccess(null);
        return;
      }

      if (
        newProduct.manejaPack &&
        (!newProduct.unidadesPorPack ||
          Number(newProduct.unidadesPorPack) <= 0)
      ) {
        setCreateError("Debes indicar cuántas unidades tiene el pack");
        setCreateSuccess(null);
        return;
      }

      setCreatingProduct(true);
      setCreateError(null);
      setCreateSuccess(null);

      console.log("NEW PRODUCT", newProduct);

      const response = await fetch("http://localhost:3001/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: newProduct.nombre,
          codigo: newProduct.codigo,
          precioVenta: Number(newProduct.precioVenta),
          costoProveedor: Number(newProduct.costoProveedor),
          stockActual: 0,
          stockMinimo:
            newProduct.stockMinimo === "" ? 0 : Number(newProduct.stockMinimo),
          activo: newProduct.activo,
          categoriaId: Number(newProduct.categoriaId),
          proveedorId: Number(newProduct.proveedorId),
          manejaPack: newProduct.manejaPack,
          unidadesPorPack: newProduct.manejaPack
            ? Number(newProduct.unidadesPorPack)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el producto");
      }

      setCreateSuccess("Producto creado correctamente");
      setNewProduct({
        nombre: "",
        codigo: "",
        precioVenta: "",
        costoProveedor: "",
        stockMinimo: "",
        categoriaId: "",
        proveedorId: "",
        activo: true,
        manejaPack: false,
        unidadesPorPack: "",
      });

      await loadProductsData();
    } catch (err: any) {
      console.error(err);
      setCreateSuccess(null);
      setCreateError(err.message || "No se pudo crear el producto");
    } finally {
      setCreatingProduct(false);
    }
  }

  function openEditForm(product: ProductoVenta) {
    setEditingProductId(product.id);
    setUpdateError(null);
    setUpdateSuccess(null);

    setEditProduct({
      id: product.id,
      nombre: product.nombre,
      codigo: product.codigo,
      precioVenta: String(product.precioVenta),
      costoProveedor: String(product.costoProveedor),
      stockMinimo: String(product.stockMinimo),
      categoriaId: String(product.categoria.id),
      proveedorId: String(product.proveedor.id),
      activo: product.activo,
      manejaPack: product.manejaPack,
      unidadesPorPack:
        product.unidadesPorPack !== null
          ? String(product.unidadesPorPack)
          : "",
    });
  }

  async function handleUpdateProduct() {
    try {
      if (
        !editProduct.nombre.trim() ||
        !editProduct.codigo.trim() ||
        editProduct.precioVenta === "" ||
        editProduct.costoProveedor === "" ||
        editProduct.categoriaId === "" ||
        editProduct.proveedorId === ""
      ) {
        setUpdateError("Completa todos los campos obligatorios");
        setUpdateSuccess(null);
        return;
      }

      if (
        editProduct.manejaPack &&
        (!editProduct.unidadesPorPack ||
          Number(editProduct.unidadesPorPack) <= 0)
      ) {
        setUpdateError("Debes indicar cuántas unidades tiene el pack");
        setUpdateSuccess(null);
        return;
      }

      setUpdatingProduct(true);
      setUpdateError(null);
      setUpdateSuccess(null);

      const response = await fetch(
        `http://localhost:3001/productos/${editProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: editProduct.nombre,
            codigo: editProduct.codigo,
            precioVenta: Number(editProduct.precioVenta),
            costoProveedor: Number(editProduct.costoProveedor),
            stockMinimo:
              editProduct.stockMinimo === ""
                ? 0
                : Number(editProduct.stockMinimo),
            activo: editProduct.activo,
            categoriaId: Number(editProduct.categoriaId),
            proveedorId: Number(editProduct.proveedorId),
            manejaPack: editProduct.manejaPack,
            unidadesPorPack: editProduct.manejaPack
              ? Number(editProduct.unidadesPorPack)
              : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el producto");
      }

      setUpdateSuccess("Producto actualizado correctamente");
      await loadProductsData();
    } catch (err: any) {
      console.error(err);
      setUpdateSuccess(null);
      setUpdateError(err.message || "No se pudo actualizar el producto");
    } finally {
      setUpdatingProduct(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Catálogo
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Productos
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">
            Administración del catálogo principal de la bodega con precios, stock,
            proveedor y configuración de packs.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateForm((prev) => !prev);
            setCreateError(null);
            setCreateSuccess(null);
          }}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          {showCreateForm ? "Cerrar formulario" : "Nuevo producto"}
        </button>
      </section>

      {showCreateForm && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Alta de producto
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Crear nuevo producto
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  <input
    type="text"
    value={newProduct.nombre}
    onChange={(e) =>
      setNewProduct((prev) => ({ ...prev, nombre: e.target.value }))
    }
    placeholder="Nombre"
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  />

  <input
    type="text"
    value={newProduct.codigo}
    onChange={(e) =>
      setNewProduct((prev) => ({ ...prev, codigo: e.target.value }))
    }
    placeholder="Código"
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  />

  <input
    type="number"
    min="0"
    value={newProduct.precioVenta}
    onChange={(e) =>
      setNewProduct((prev) => ({
        ...prev,
        precioVenta: e.target.value,
      }))
    }
    placeholder="Precio de venta"
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  />

  <input
    type="number"
    min="0"
    value={newProduct.costoProveedor}
    onChange={(e) =>
      setNewProduct((prev) => ({
        ...prev,
        costoProveedor: e.target.value,
      }))
    }
    placeholder="Costo proveedor"
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  />

  <input
    type="number"
    min="0"
    value={newProduct.stockMinimo}
    onChange={(e) =>
      setNewProduct((prev) => ({
        ...prev,
        stockMinimo: e.target.value,
      }))
    }
    placeholder="Stock mínimo"
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  />

  <select
    value={newProduct.categoriaId}
    onChange={(e) =>
      setNewProduct((prev) => ({
        ...prev,
        categoriaId: e.target.value,
      }))
    }
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  >
    <option value="">Seleccionar categoría</option>
    {categories.map((category) => (
      <option key={category.id} value={category.id}>
        {category.nombre}
      </option>
    ))}
  </select>

  <select
    value={newProduct.proveedorId}
    onChange={(e) =>
      setNewProduct((prev) => ({
        ...prev,
        proveedorId: e.target.value,
      }))
    }
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  >
    <option value="">Seleccionar proveedor</option>
    {providers.map((provider) => (
      <option key={provider.id} value={provider.id}>
        {provider.nombre}
      </option>
    ))}
  </select>

  <select
    value={newProduct.activo ? "true" : "false"}
    onChange={(e) =>
      setNewProduct((prev) => ({
        ...prev,
        activo: e.target.value === "true",
      }))
    }
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
  >
    <option value="true">Activo</option>
    <option value="false">Inactivo</option>
  </select>

  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
    <input
      type="checkbox"
      checked={newProduct.manejaPack}
      onChange={(e) =>
        setNewProduct((prev) => ({
          ...prev,
          manejaPack: e.target.checked,
          unidadesPorPack: e.target.checked ? prev.unidadesPorPack || "1" : "",
        }))
      }
    />
    Maneja pack
  </label>

  <input
    type="number"
    min="1"
    value={newProduct.unidadesPorPack}
    onChange={(e) =>
      setNewProduct((prev) => ({
        ...prev,
        unidadesPorPack: e.target.value,
      }))
    }
    placeholder="Unidades por pack"
    disabled={!newProduct.manejaPack}
    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
  />
</div>

          {createError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {createSuccess}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreateProduct}
              disabled={creatingProduct}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingProduct ? "Guardando..." : "Guardar producto"}
            </button>

            <button
              onClick={() => {
                setShowCreateForm(false);
                setCreateError(null);
                setCreateSuccess(null);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {editingProductId !== null && (
        <section className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">
              Edición
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Editar producto
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              type="text"
              value={editProduct.nombre}
              onChange={(e) =>
                setEditProduct((prev) => ({ ...prev, nombre: e.target.value }))
              }
              placeholder="Nombre"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            />

            <input
              type="text"
              value={editProduct.codigo}
              onChange={(e) =>
                setEditProduct((prev) => ({ ...prev, codigo: e.target.value }))
              }
              placeholder="Código"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            />

            <input
              type="number"
              min="0"
              value={editProduct.precioVenta}
              onChange={(e) =>
                setEditProduct((prev) => ({
                  ...prev,
                  precioVenta: e.target.value,
                }))
              }
              placeholder="Precio de venta"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            />

            <input
              type="number"
              min="0"
              value={editProduct.costoProveedor}
              onChange={(e) =>
                setEditProduct((prev) => ({
                  ...prev,
                  costoProveedor: e.target.value,
                }))
              }
              placeholder="Costo proveedor"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            />

            <input
              type="number"
              min="0"
              value={editProduct.stockMinimo}
              onChange={(e) =>
                setEditProduct((prev) => ({
                  ...prev,
                  stockMinimo: e.target.value,
                }))
              }
              placeholder="Stock mínimo"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            />

            <select
              value={editProduct.categoriaId}
              onChange={(e) =>
                setEditProduct((prev) => ({
                  ...prev,
                  categoriaId: e.target.value,
                }))
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>

            <select
              value={editProduct.proveedorId}
              onChange={(e) =>
                setEditProduct((prev) => ({
                  ...prev,
                  proveedorId: e.target.value,
                }))
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            >
              <option value="">Seleccionar proveedor</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.nombre}
                </option>
              ))}
            </select>

            <select
              value={editProduct.activo ? "true" : "false"}
              onChange={(e) =>
                setEditProduct((prev) => ({
                  ...prev,
                  activo: e.target.value === "true",
                }))
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white"
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editProduct.manejaPack}
                onChange={(e) =>
                  setEditProduct((prev) => ({
                    ...prev,
                    manejaPack: e.target.checked,
                    unidadesPorPack: e.target.checked
                      ? prev.unidadesPorPack || "1"
                      : "",
                  }))
                }
              />
              Maneja pack
            </label>

            <input
              type="number"
              min="1"
              value={editProduct.unidadesPorPack}
              onChange={(e) =>
                setEditProduct((prev) => ({
                  ...prev,
                  unidadesPorPack: e.target.value,
                }))
              }
              placeholder="Unidades por pack"
              disabled={!editProduct.manejaPack}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {updateError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {updateError}
            </div>
          )}

          {updateSuccess && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {updateSuccess}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUpdateProduct}
              disabled={updatingProduct}
              className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingProduct ? "Actualizando..." : "Guardar cambios"}
            </button>

            <button
              onClick={() => {
                setEditingProductId(null);
                setUpdateError(null);
                setUpdateSuccess(null);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar edición
            </button>
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto..."
              className="h-12 min-w-[240px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:bg-white"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category === "TODAS" ? "Todas las categorías" : category}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:bg-white"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>

          <span className="text-sm font-medium text-slate-500">
            {filteredProducts.length} productos cargados
          </span>
        </div>

        {loading && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Cargando productos...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay productos que coincidan con la búsqueda o los filtros.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Categoría</th>
                <th className="pb-2">Proveedor</th>
                <th className="pb-2">Precio venta</th>
                <th className="pb-2">Costo proveedor</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Mínimo</th>
                <th className="pb-2">Pack</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Acción</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const lowStock = product.stockActual <= product.stockMinimo;

                return (
                  <tr key={product.id} className="rounded-2xl bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {product.nombre}
                        </p>
                        <p className="text-sm text-slate-500">
                          Código: {product.codigo}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {product.categoria.nombre}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {product.proveedor?.nombre ?? "Sin proveedor"}
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {formatGs(product.precioVenta)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatGs(product.costoProveedor)}
                    </td>

                    <td
                      className={`px-4 py-4 font-semibold ${
                        lowStock ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {product.stockActual}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {product.stockMinimo}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {product.manejaPack
                        ? `${product.unidadesPorPack ?? 0} u.`
                        : "No"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.activo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {product.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(product)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function IngresosView() {
  const [providers, setProviders] = useState<ProveedorOption[]>([]);
  const [products, setProducts] = useState<ProductoVenta[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);

  const [providerId, setProviderId] = useState<number | "">("");
  const [tipoIngreso, setTipoIngreso] = useState("CONSIGNACION");
  const [observacion, setObservacion] = useState("");
  const [items, setItems] = useState<IngresoItemForm[]>([
    {
      id: 1,
      productoId: "",
      cantidad: 1,
      costoUnitario: 0,
    },
  ]);

  const [submittingIngreso, setSubmittingIngreso] = useState(false);
  const [ingresoError, setIngresoError] = useState<string | null>(null);
  const [ingresoSuccess, setIngresoSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        setErrorData(null);

        const [providersResponse, productsResponse] = await Promise.all([
          fetchJson<ProveedorOption[]>("/proveedores"),
          fetchJson<ProductoVenta[]>("/productos"),
        ]);

        setProviders(providersResponse);
        setProducts(productsResponse);
      } catch (err) {
        console.error(err);
        setErrorData("No se pudieron cargar proveedores y productos");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  function addRow() {
    setIngresoError(null);
    setIngresoSuccess(null);

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productoId: "",
        cantidad: 1,
        costoUnitario: 0,
      },
    ]);
  }

  function removeRow(id: number) {
    setIngresoError(null);
    setIngresoSuccess(null);

    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  }

  function updateItem(
    id: number,
    field: keyof IngresoItemForm,
    value: string | number
  ) {
    setIngresoError(null);
    setIngresoSuccess(null);

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "productoId") {
          const selectedProduct = products.find(
            (product) => product.id === Number(value)
          );

          if (selectedProduct) {
            updated.costoUnitario = selectedProduct.costoProveedor;
          }
        }

        return updated;
      })
    );
  }

  async function handleSaveIngreso() {
    try {
      if (!providerId) {
        setIngresoError("Selecciona un proveedor");
        setIngresoSuccess(null);
        return;
      }

      const detallesValidos = items.filter(
        (item) =>
          item.productoId !== "" &&
          Number(item.cantidad) > 0 &&
          Number(item.costoUnitario) >= 0
      );

      if (detallesValidos.length === 0) {
        setIngresoError("Agrega al menos un producto válido al ingreso");
        setIngresoSuccess(null);
        return;
      }

      setSubmittingIngreso(true);
      setIngresoError(null);
      setIngresoSuccess(null);

      const response = await fetch("http://localhost:3001/ingresos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proveedorId: providerId,
          tipoIngreso,
          observacion,
          detalles: detallesValidos.map((item) => ({
            productoId: item.productoId,
            cantidad: Number(item.cantidad),
            costoUnitario: Number(item.costoUnitario),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar el ingreso");
      }

      setProviderId("");
      setTipoIngreso("CONSIGNACION");
      setObservacion("");
      setItems([
        {
          id: 1,
          productoId: "",
          cantidad: 1,
          costoUnitario: 0,
        },
      ]);
      setIngresoError(null);
      setIngresoSuccess("Ingreso registrado correctamente");
    } catch (err: any) {
      console.error(err);
      setIngresoSuccess(null);
      setIngresoError(err.message || "No se pudo registrar el ingreso");
    } finally {
      setSubmittingIngreso(false);
    }
  }

  const totalIngreso = items.reduce((acc, item) => {
    const subtotal = Number(item.cantidad) * Number(item.costoUnitario);
    return acc + subtotal;
  }, 0);

  const validProductsForProvider = providerId
    ? products.filter((product) => product.proveedor?.id === Number(providerId))
    : [];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Logística
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Ingresos de mercadería
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">
            Registro de productos recibidos desde proveedor, tanto en consignación
            como en compra directa.
          </p>
        </div>

        <button
          onClick={handleSaveIngreso}
          disabled={submittingIngreso}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submittingIngreso ? "Guardando ingreso..." : "Guardar ingreso"}
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.4fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Formulario
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Datos del ingreso
            </h3>
          </div>

          {loadingData && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Cargando datos...
            </div>
          )}

          {errorData && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
              {errorData}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Proveedor
              </label>
              <select
                value={providerId}
                onChange={(e) =>
                  setProviderId(e.target.value ? Number(e.target.value) : "")
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              >
                <option value="">Seleccionar proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tipo de ingreso
              </label>
              <select
                value={tipoIngreso}
                onChange={(e) => setTipoIngreso(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              >
                <option value="CONSIGNACION">Consignación</option>
                <option value="COMPRA_DIRECTA">Compra directa</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observaciones
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej.: reposición para fin de semana, entrega parcial, etc."
                className="min-h-[130px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>

            {ingresoError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {ingresoError}
              </div>
            )}

            {ingresoSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {ingresoSuccess}
              </div>
            )}

            <div className="grid gap-3">
              <button
                onClick={handleSaveIngreso}
                disabled={submittingIngreso}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingIngreso ? "Confirmando..." : "Confirmar ingreso"}
              </button>

              <button
                onClick={() => {
                  setProviderId("");
                  setTipoIngreso("CONSIGNACION");
                  setObservacion("");
                  setItems([
                    {
                      id: 1,
                      productoId: "",
                      cantidad: 1,
                      costoUnitario: 0,
                    },
                  ]);
                  setIngresoError(null);
                  setIngresoSuccess(null);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                Detalle
              </p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">
                Productos ingresados
              </h3>
            </div>

            <button
              onClick={addRow}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Agregar fila
            </button>
          </div>

          {!providerId && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
              Selecciona primero un proveedor para cargar productos de ese proveedor.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Cantidad</th>
                  <th className="pb-2">Costo unitario</th>
                  <th className="pb-2">Subtotal</th>
                  <th className="pb-2">Acción</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const subtotal =
                    Number(item.cantidad) * Number(item.costoUnitario);

                  return (
                    <tr key={item.id} className="rounded-2xl bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4">
                        <select
                          value={item.productoId}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "productoId",
                              e.target.value ? Number(e.target.value) : ""
                            )
                          }
                          disabled={!providerId}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
                        >
                          <option value="">Seleccionar producto</option>
                          {validProductsForProvider.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.nombre} - {product.codigo}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "cantidad",
                              Number(e.target.value) || 0
                            )
                          }
                          className="h-11 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          value={item.costoUnitario}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "costoUnitario",
                              Number(e.target.value) || 0
                            )
                          }
                          className="h-11 w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
                        />
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {formatGs(subtotal)}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        <button
                          onClick={() => removeRow(item.id)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Total del ingreso
            </p>
            <h3 className="mt-2 text-4xl font-bold tracking-tight">
              {formatGs(totalIngreso)}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {items.length} filas registradas en este ingreso
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function LiquidacionesView() {
  type ProveedorConDeuda = {
    proveedor: ProveedorOption;
    resumen: LiquidacionResumen;
  };

  type LiquidacionHistorial = {
  id: number;
  fecha: string;
  periodo: string;
  totalPagar: number;
  cerrada: boolean;
  fechaCierre: string | null;
  observacion: string | null;
  createdAt: string;
  updatedAt: string;
  proveedor: {
    id: number;
    nombre: string;
  };
  detalles: Array<{
    id: number;
    cantidadRecibida: number;
    cantidadVendida: number;
    cantidadRestante: number;
    costoUnitario: number;
    subtotal: number;
    producto: {
      id: number;
      nombre: string;
      codigo: string;
      manejaPack: boolean;
      unidadesPorPack: number | null;
    };
  }>;
};

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [activeTab, setActiveTab] = useState<"PENDIENTES" | "HISTORIAL">(
    "PENDIENTES"
  );

  const [providers, setProviders] = useState<ProveedorOption[]>([]);
  const [periodo, setPeriodo] = useState(currentMonth);

  const [liquidacionesPendientes, setLiquidacionesPendientes] = useState<
    ProveedorConDeuda[]
  >([]);

    const [historialLiquidaciones, setHistorialLiquidaciones] = useState<
    LiquidacionHistorial[]
  >([]);

  const [historialSearch, setHistorialSearch] = useState("");
  const [historialProveedorFiltro, setHistorialProveedorFiltro] =
    useState("TODOS");
  const [historialPeriodoFiltro, setHistorialPeriodoFiltro] = useState("TODOS");

  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(
    null
  );

  const [selectedHistorial, setSelectedHistorial] =
    useState<LiquidacionHistorial | null>(null);

  const [loadingPendientes, setLoadingPendientes] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [closingId, setClosingId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadProviders() {
    const data = await fetchJson<ProveedorOption[]>("/proveedores");
    setProviders(data);
  }

  async function loadPendientes(
    providerList: ProveedorOption[],
    periodoActual: string,
    selectedId?: number | null
  ) {
    if (providerList.length === 0 || !periodoActual) {
      setLiquidacionesPendientes([]);
      setSelectedProviderId(null);
      setLoadingPendientes(false);
      return;
    }

    setLoadingPendientes(true);

    try {
      const results = await Promise.all(
        providerList.map(async (provider) => {
          try {
            const resumen = await fetchJson<LiquidacionResumen>(
              `/liquidaciones/resumen/calculo?proveedorId=${provider.id}&periodo=${periodoActual}`
            );

            if (!resumen.detalles || resumen.detalles.length === 0) {
              return null;
            }

            if (!resumen.totalGeneral || resumen.totalGeneral <= 0) {
              return null;
            }

            return {
              proveedor: provider,
              resumen,
            };
          } catch (_err) {
            return null;
          }
        })
      );

      const pendientes = results.filter(
        (item): item is ProveedorConDeuda => item !== null
      );

      setLiquidacionesPendientes(pendientes);

      if (pendientes.length === 0) {
        setSelectedProviderId(null);
      } else {
        const existeSeleccionado = pendientes.some(
          (item) => item.proveedor.id === selectedId
        );

        if (existeSeleccionado && selectedId) {
          setSelectedProviderId(selectedId);
        } else {
          setSelectedProviderId(pendientes[0].proveedor.id);
        }
      }
    } finally {
      setLoadingPendientes(false);
    }
  }

  async function loadHistorial() {
    setLoadingHistorial(true);

    try {
      const data = await fetchJson<LiquidacionHistorial[]>("/liquidaciones");

            const cerradas = data
        .filter((item) => item.cerrada)
        .sort(
          (a, b) =>
            new Date(b.fechaCierre ?? b.updatedAt).getTime() -
            new Date(a.fechaCierre ?? a.updatedAt).getTime()
        );
      setHistorialLiquidaciones(cerradas);
    } finally {
      setLoadingHistorial(false);
    }
  }

  async function refreshAll(options?: {
    keepSelectedProviderId?: number | null;
    keepModalOpenId?: number | null;
  }) {
    try {
      setError(null);

      let providerList = providers;

      if (providerList.length === 0) {
        providerList = await fetchJson<ProveedorOption[]>("/proveedores");
        setProviders(providerList);
      }

      await Promise.all([
        loadPendientes(
          providerList,
          periodo,
          options?.keepSelectedProviderId ?? selectedProviderId
        ),
        loadHistorial(),
      ]);

      if (options?.keepModalOpenId) {
        const data = await fetchJson<LiquidacionHistorial[]>("/liquidaciones");
        const encontrada =
          data.find(
            (item) => item.id === options.keepModalOpenId && item.cerrada
          ) ?? null;
        setSelectedHistorial(encontrada);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos de liquidaciones");
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setError(null);
        const providerList = await fetchJson<ProveedorOption[]>("/proveedores");
        setProviders(providerList);

        await Promise.all([
          loadPendientes(providerList, periodo, null),
          loadHistorial(),
        ]);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las liquidaciones");
        setLoadingPendientes(false);
        setLoadingHistorial(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (providers.length === 0) return;

    loadPendientes(providers, periodo, selectedProviderId).catch((err) => {
      console.error(err);
      setError("No se pudieron cargar las liquidaciones pendientes");
      setLoadingPendientes(false);
    });
  }, [periodo]);

  const selectedLiquidacion =
    liquidacionesPendientes.find(
      (item) => item.proveedor.id === selectedProviderId
    ) ?? null;

      const historialProviderOptions = [
    "TODOS",
    ...Array.from(
      new Set(historialLiquidaciones.map((item) => item.proveedor.nombre))
    ).sort((a, b) => a.localeCompare(b)),
  ];

  const historialPeriodoOptions = [
    "TODOS",
    ...Array.from(
      new Set(historialLiquidaciones.map((item) => item.periodo))
    ).sort((a, b) => b.localeCompare(a)),
  ];

  const historialFiltrado = historialLiquidaciones.filter((item) => {
    const search = historialSearch.trim().toLowerCase();

    const matchesSearch =
      search === "" ||
      item.proveedor.nombre.toLowerCase().includes(search) ||
      String(item.id).includes(search);

    const matchesProveedor =
      historialProveedorFiltro === "TODOS" ||
      item.proveedor.nombre === historialProveedorFiltro;

    const matchesPeriodo =
      historialPeriodoFiltro === "TODOS" ||
      item.periodo === historialPeriodoFiltro;

    return matchesSearch && matchesProveedor && matchesPeriodo;
  });

  async function handleCerrarLiquidacion(proveedorId: number) {
    try {
      setClosingId(proveedorId);
      setError(null);
      setSuccess(null);

      const crearResponse = await fetch("http://localhost:3001/liquidaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proveedorId,
          periodo,
        }),
      });

      const crearData = await crearResponse.json();

      if (!crearResponse.ok) {
        throw new Error(crearData.error || "No se pudo generar la liquidación");
      }

      const cerrarResponse = await fetch(
        `http://localhost:3001/liquidaciones/${crearData.id}/cerrar`,
        {
          method: "PATCH",
        }
      );

      const cerrarData = await cerrarResponse.json();

      if (!cerrarResponse.ok) {
        throw new Error(
          cerrarData.error || "No se pudo cerrar la liquidación"
        );
      }

      setSuccess("Liquidación cerrada correctamente");

      await refreshAll({
        keepSelectedProviderId: proveedorId,
      });

      setActiveTab("HISTORIAL");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cerrar la liquidación");
    } finally {
      setClosingId(null);
    }
  }

  function buildPrintableHtml(liquidacion: LiquidacionHistorial) {
    const rows = liquidacion.detalles
      .map(
        (item) => `
          <tr>
            <td>${item.producto.nombre}</td>
            <td>${item.producto.codigo}</td>
            <td>${item.cantidadRecibida}</td>
            <td>${item.cantidadVendida}</td>
            <td>${item.cantidadRestante}</td>
            <td>${formatGs(item.costoUnitario)}</td>
            <td>${formatGs(item.subtotal)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <html>
        <head>
          <title>Liquidación #${liquidacion.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #0f172a;
            }
            h1, h2, h3, p {
              margin: 0 0 12px 0;
            }
            .header {
              margin-bottom: 24px;
            }
            .meta {
              margin-bottom: 24px;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background: #f1f5f9;
            }
            .total {
              margin-top: 24px;
              font-size: 20px;
              font-weight: bold;
            }
            .note {
              margin-top: 20px;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Liquidación cerrada #${liquidacion.id}</h1>
            <h3>${liquidacion.proveedor.nombre}</h3>
          </div>

          <div class="meta">
            <p><strong>Período:</strong> ${liquidacion.periodo}</p>
            <p><strong>Fecha de registro:</strong> ${formatDateTime(
              liquidacion.createdAt
            )}</p>
            <p><strong>Fecha de cierre:</strong> ${formatDateTime(
              liquidacion.fechaCierre ?? liquidacion.updatedAt
            )}</p>
            <p><strong>Observación:</strong> ${
              liquidacion.observacion?.trim() || "Sin observaciones"
            }</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Recibido</th>
                <th>Vendido</th>
                <th>Restante</th>
                <th>Costo unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <p class="total">Total pagado: ${formatGs(liquidacion.totalPagar)}</p>
          <p class="note">Para guardar en PDF, usa la opción "Guardar como PDF" desde la ventana de impresión del navegador.</p>
        </body>
      </html>
    `;
  }

  function handlePrintLiquidacion(liquidacion: LiquidacionHistorial) {
    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      setError("El navegador bloqueó la ventana de impresión");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintableHtml(liquidacion));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function handleDownloadPdf(liquidacion: LiquidacionHistorial) {
    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      setError("El navegador bloqueó la ventana para guardar PDF");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintableHtml(liquidacion));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Finanzas & consignación
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Liquidaciones
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">
            Gestiona liquidaciones pendientes y consulta el historial de cierres
            realizados de forma clara y ordenada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-300"
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setActiveTab("PENDIENTES");
              setError(null);
              setSuccess(null);
            }}
            className={`rounded-[20px] px-5 py-4 text-sm font-semibold transition ${
              activeTab === "PENDIENTES"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Pendientes
          </button>

          <button
            onClick={() => {
              setActiveTab("HISTORIAL");
              setError(null);
              setSuccess(null);
            }}
            className={`rounded-[20px] px-5 py-4 text-sm font-semibold transition ${
              activeTab === "HISTORIAL"
                ? "bg-slate-950 text-white shadow-lg"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Historial
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {activeTab === "PENDIENTES" && (
        <>
          {loadingPendientes ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
              <p className="text-sm text-slate-500">
                Cargando liquidaciones pendientes...
              </p>
            </section>
          ) : liquidacionesPendientes.length === 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
              <p className="text-sm text-slate-500">
                No hay deudas pendientes para el período seleccionado.
              </p>
            </section>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                    Proveedores con deuda
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    Pendientes del período
                  </h3>
                </div>

                <div className="space-y-4">
                  {liquidacionesPendientes.map((item) => {
                    const isActive = item.proveedor.id === selectedProviderId;

                    return (
                      <button
                        key={item.proveedor.id}
                        onClick={() => {
                          setSelectedProviderId(item.proveedor.id);
                          setError(null);
                          setSuccess(null);
                        }}
                        className={`w-full rounded-[22px] border p-4 text-left transition ${
                          isActive
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-slate-50/70 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.proveedor.nombre}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.resumen.detalles.length} productos pendientes
                            </p>
                          </div>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                            {formatGs(item.resumen.totalGeneral)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                {!selectedLiquidacion ? (
                  <p className="text-sm text-slate-500">
                    Selecciona un proveedor para ver el detalle.
                  </p>
                ) : (
                  <>
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                          Detalle de liquidación
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-950">
                          {selectedLiquidacion.proveedor.nombre}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Período {periodo}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleCerrarLiquidacion(
                            selectedLiquidacion.proveedor.id
                          )
                        }
                        disabled={
                          closingId === selectedLiquidacion.proveedor.id
                        }
                        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {closingId === selectedLiquidacion.proveedor.id
                          ? "Cerrando..."
                          : "Cerrar liquidación"}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
                        <thead>
                          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <th className="pb-2">Producto</th>
                            <th className="pb-2">Ingresado</th>
                            <th className="pb-2">Vendido</th>
                            <th className="pb-2">Stock</th>
                            <th className="pb-2">Costo</th>
                            <th className="pb-2">Total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedLiquidacion.resumen.detalles.map((item) => (
                            <tr
                              key={item.productoId}
                              className="rounded-2xl bg-slate-50"
                            >
                              <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-900">
                                {item.nombreProducto}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {item.cantidadIngresada}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {item.cantidadVendida}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {item.stockActual}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {formatGs(item.costoUnitario)}
                              </td>
                              <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-950">
                                {formatGs(item.subtotalPagar)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                        Total a pagar
                      </p>
                      <h3 className="mt-2 text-4xl font-bold tracking-tight">
                        {formatGs(selectedLiquidacion.resumen.totalGeneral)}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        Deuda pendiente actual de este proveedor
                      </p>
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}

            {activeTab === "HISTORIAL" && (
        <>
          {loadingHistorial ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
              <p className="text-sm text-slate-500">
                Cargando historial de liquidaciones...
              </p>
            </section>
          ) : historialLiquidaciones.length === 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
              <p className="text-sm text-slate-500">
                Todavía no hay liquidaciones cerradas para mostrar.
              </p>
            </section>
          ) : (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-950">
                    Historial cerrado
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    Liquidaciones registradas
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Busca, filtra y revisa cada liquidación cerrada sin cargar la
                    pantalla con demasiado detalle.
                  </p>
                </div>

                <div className="rounded-[22px] bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Resultados
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {historialFiltrado.length}
                  </p>
                </div>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="text"
                  value={historialSearch}
                  onChange={(e) => setHistorialSearch(e.target.value)}
                  placeholder="Buscar por proveedor o número..."
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white xl:col-span-2"
                />

                <select
                  value={historialProveedorFiltro}
                  onChange={(e) => setHistorialProveedorFiltro(e.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:bg-white"
                >
                  {historialProviderOptions.map((proveedor) => (
                    <option key={proveedor} value={proveedor}>
                      {proveedor === "TODOS"
                        ? "Todos los proveedores"
                        : proveedor}
                    </option>
                  ))}
                </select>

                <select
                  value={historialPeriodoFiltro}
                  onChange={(e) => setHistorialPeriodoFiltro(e.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:bg-white"
                >
                  {historialPeriodoOptions.map((periodoOption) => (
                    <option key={periodoOption} value={periodoOption}>
                      {periodoOption === "TODOS"
                        ? "Todos los períodos"
                        : periodoOption}
                    </option>
                  ))}
                </select>
              </div>

              {historialFiltrado.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No hay liquidaciones que coincidan con los filtros actuales.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <th className="pb-2">Liquidación</th>
                        <th className="pb-2">Proveedor</th>
                        <th className="pb-2">Período</th>
                        <th className="pb-2">Fecha cierre</th>
                        <th className="pb-2">Productos</th>
                        <th className="pb-2">Total pagado</th>
                        <th className="pb-2">Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {historialFiltrado.map((item) => (
                        <tr key={item.id} className="rounded-2xl bg-slate-50">
                          <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-900">
                            #{item.id}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {item.proveedor.nombre}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {item.periodo}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {formatDateTime(item.fechaCierre ?? item.updatedAt)}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {item.detalles.length}
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-950">
                            {formatGs(item.totalPagar)}
                          </td>

                          <td className="rounded-r-2xl px-4 py-4">
                            <button
                              onClick={() => setSelectedHistorial(item)}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {selectedHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Detalle de liquidación
                </p>
                <h3 className="mt-2 text-3xl font-bold text-slate-950">
                  #{selectedHistorial.id} · {selectedHistorial.proveedor.nombre}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Período {selectedHistorial.periodo}
                </p>
              </div>

              <button
                onClick={() => setSelectedHistorial(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Proveedor
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {selectedHistorial.proveedor.nombre}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Fecha de cierre
                  </p>
                                    <p className="mt-2 text-lg font-bold text-slate-950">
                    {formatDateTime(
                      selectedHistorial.fechaCierre ??
                        selectedHistorial.updatedAt
                    )}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Productos
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {selectedHistorial.detalles.length}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Total pagado
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {formatGs(selectedHistorial.totalPagar)}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Observación
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {selectedHistorial.observacion?.trim() || "Sin observaciones"}
                </p>
              </div>

             <div className="mt-6 overflow-x-auto">
  <table className="w-full min-w-[1500px] table-fixed border-separate border-spacing-y-3">
    <thead>
      <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        <th className="w-[220px] pb-2 text-left">Producto</th>
        <th className="w-[120px] pb-2 text-left">Código</th>
        <th className="w-[90px] pb-2 text-center">Ingresado</th>
        <th className="w-[150px] pb-2 text-center">Packs ingresados</th>
        <th className="w-[90px] pb-2 text-center">Vendido</th>
        <th className="w-[90px] pb-2 text-center">Pack</th>
        <th className="w-[130px] pb-2 text-center">Packs a liquidar</th>
        <th className="w-[135px] pb-2 text-center">Unidades liquidadas</th>
        <th className="w-[140px] pb-2 text-center">Packs restantes</th>
        <th className="w-[110px] pb-2 text-center">Costo unitario</th>
        <th className="w-[120px] pb-2 text-right">Subtotal</th>
      </tr>
    </thead>

                      <tbody>
                        {selectedHistorial.detalles.map((item) => {
                    const packInfo = getPackMetrics({
                      cantidadIngresada: item.cantidadRecibida,
                      cantidadVendida: item.cantidadVendida,
                      stockActual: item.cantidadRestante,
                      manejaPack: item.producto.manejaPack,
                      unidadesPorPack: item.producto.unidadesPorPack,
                    });

                    return (
                      <tr key={item.id} className="align-middle rounded-2xl bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4 text-left font-semibold text-slate-900">
                          {item.producto.nombre}
                        </td>

                        <td className="px-4 py-4 text-left text-slate-700">
                          {item.producto.codigo}
                        </td>

                        <td className="px-4 py-4 text-center text-slate-700 whitespace-nowrap">
                          {item.cantidadRecibida} u.
                        </td>

                        <td className="px-4 py-4 text-center text-slate-700">
                          {packInfo.packsIngresados}
                        </td>

                        <td className="px-4 py-4 text-center text-slate-700 whitespace-nowrap">
                          {item.cantidadVendida} u.
                        </td>

                        <td className="px-4 py-4 text-center text-slate-700 whitespace-nowrap">
                          {packInfo.packLabel}
                        </td>

                        <td className="px-4 py-4 text-center font-medium text-blue-700">
                          {packInfo.packsALiquidar}
                        </td>

                        <td className="px-4 py-4 text-center font-medium text-slate-900 whitespace-nowrap">
                          {packInfo.unidadesLiquidadas}
                        </td>

                        <td className="px-4 py-4 text-center text-slate-700">
                          {packInfo.packsRestantes}
                        </td>

                        <td className="px-4 py-4 text-center text-slate-700 whitespace-nowrap">
                          {formatGs(item.costoUnitario)}
                        </td>

                        <td className="rounded-r-2xl px-4 py-4 text-right font-semibold text-slate-950 whitespace-nowrap">
                          {formatGs(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                      </tbody>
                    </table>
              </div>

<div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
  Los productos configurados por pack se liquidan redondeando hacia arriba al
  pack completo. Por eso las unidades liquidadas y el total pueden ser mayores
  que las unidades vendidas reales.
</div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-950 p-5 text-white">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Total liquidado
                  </p>
                  <h3 className="mt-2 text-4xl font-bold tracking-tight">
                    {formatGs(selectedHistorial.totalPagar)}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handlePrintLiquidacion(selectedHistorial)}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Imprimir
                  </button>

                  <button
                    onClick={() => generarPDFLiquidacion(selectedHistorial)}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Descargar PDF
                  </button>

                  <button
                    onClick={() => setSelectedHistorial(null)}
                    className="rounded-2xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Content({ active }: { active: ModuleKey }) {
  switch (active) {
    case "dashboard":
      return <DashboardView />;
    case "ventas":
      return <SalesView />;
    case "productos":
      return <ProductsView />;
    case "categorias":
      return (
        <PlaceholderPage
          eyebrow="Organización"
          title="Categorías"
          description="Aquí irá el módulo para gestionar categorías como cervezas, gaseosas, aguas, energéticas, snacks e hielo."
        />
      );
    case "stock":
      return <StockView />;
    case "ingresos":
      return <IngresosView />;
    case "proveedores":
      return (
        <PlaceholderPage
          eyebrow="Relación comercial"
          title="Proveedores"
          description="Aquí irá el módulo para consultar deuda, tipo de acuerdo e historial por proveedor."
        />
      );
    case "liquidaciones":
      return <LiquidacionesView />;
    case "reportes":
      return (
        <PlaceholderPage
          eyebrow="Análisis"
          title="Reportes"
          description="Aquí irán los paneles para ventas, inventario, productos más vendidos y liquidaciones."
        />
      );
    case "usuarios":
      return (
        <PlaceholderPage
          eyebrow="Seguridad"
          title="Usuarios"
          description="Aquí irá la gestión de usuarios, roles y permisos dentro del sistema."
        />
      );
    case "configuracion":
      return (
        <PlaceholderPage
          eyebrow="Sistema"
          title="Configuración"
          description="Aquí irán los ajustes generales del negocio, stock mínimo, moneda y preferencias."
        />
      );
    default:
      return null;
  }
}

export default function App() {
  const [active, setActive] = useState<ModuleKey>("dashboard");

  const currentTitle = useMemo(
    () => navigation.find((item) => item.key === active)?.label ?? "Dashboard",
    [active]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_35%,_#f8fafc)] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1680px] gap-6 rounded-[36px] border border-white/50 bg-white/60 p-3 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur md:p-4">
        <Sidebar active={active} onChange={setActive} />

        <main className="min-w-0 flex-1 rounded-[30px] bg-white/70 p-4 md:p-6">
          <Header title={currentTitle} />
          <Content active={active} />
        </main>
      </div>
    </div>
  );
}