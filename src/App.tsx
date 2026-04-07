import React, { useMemo, useState } from "react";
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
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && <span className="ml-auto h-8 w-1 rounded-full bg-blue-600" />}
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
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{title}</h2>
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
  title: string
  value: string
  helper: string
  tone?: "blue" | "green" | "red" | "amber"
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className={`mb-4 inline-flex rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${tones[tone]}`}>
        {title}
      </div>
      <h3 className="text-4xl font-bold tracking-tight text-slate-950">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

function DashboardView() {
  const weeklyData = [42, 65, 51, 74, 60, 88, 57]

  const topProducts = [
    { name: "Cerveza Pilsen 1L", provider: "Distribuidora Central", sales: 142 },
    { name: "Coca-Cola 500ml", provider: "Bebidas Santa Ana", sales: 98 },
    { name: "Agua Mineral 600ml", provider: "Bebidas Santa Ana", sales: 76 },
    { name: "Monster Energy", provider: "Global Drinks", sales: 54 },
  ]

  const recentSales = [
    { id: "V-1032", date: "27/03/2026 18:10", total: "Gs. 41.000", status: "Pagado" },
    { id: "V-1031", date: "27/03/2026 17:42", total: "Gs. 24.000", status: "Pagado" },
    { id: "V-1030", date: "27/03/2026 17:20", total: "Gs. 56.000", status: "Pagado" },
    { id: "V-1029", date: "27/03/2026 16:58", total: "Gs. 17.000", status: "Pagado" },
  ]

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
            Bienvenido de nuevo. Aquí tienes lo más importante del día en la bodega.
          </p>
        </div>

        <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
          Nueva venta
        </button>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas del día"
          value="Gs. 452.800"
          helper="+12% respecto a ayer"
          tone="blue"
        />
        <StatCard
          title="Ventas del mes"
          value="Gs. 12.405.000"
          helper="Buen ritmo de ventas mensual"
          tone="green"
        />
        <StatCard
          title="Deuda proveedores"
          value="Gs. 1.853.000"
          helper="Pendiente de cierre mensual"
          tone="red"
        />
        <StatCard
          title="Alerta de stock"
          value="12 ítems"
          helper="Productos que requieren reposición"
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-950">Tendencia Semanal</h3>
              <p className="mt-1 text-sm text-slate-500">
                Análisis visual de ventas por día
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
              Productos con mejor rotación
            </p>
          </div>

          <div className="space-y-4">
            {topProducts.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.provider}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{item.sales}</p>
                  <p className="text-xs font-medium text-emerald-600">ventas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
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
                <th className="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id} className="rounded-2xl bg-slate-50">
                  <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-900">
                    {sale.id}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{sale.date}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{sale.total}</td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SalesView() {
  const products = [
    { id: 1, name: "Cerveza Pilsen 1L", category: "Bebidas", price: "Gs. 12.000", stock: 24 },
    { id: 2, name: "Coca-Cola 500ml", category: "Gaseosas", price: "Gs. 7.000", stock: 8 },
    { id: 3, name: "Agua Mineral 600ml", category: "Aguas", price: "Gs. 5.000", stock: 30 },
    { id: 4, name: "Monster Energy", category: "Energéticas", price: "Gs. 14.000", stock: 5 },
    { id: 5, name: "Papas Chips", category: "Snacks", price: "Gs. 6.000", stock: 18 },
    { id: 6, name: "Hielo 2kg", category: "Hielo", price: "Gs. 10.000", stock: 12 },
  ]

  const cart = [
    { id: 1, name: "Cerveza Pilsen 1L", unitPrice: "Gs. 12.000", qty: 2, subtotal: "Gs. 24.000" },
    { id: 2, name: "Papas Chips", unitPrice: "Gs. 6.000", qty: 1, subtotal: "Gs. 6.000" },
    { id: 3, name: "Hielo 2kg", unitPrice: "Gs. 10.000", qty: 1, subtotal: "Gs. 10.000" },
  ]

  const payments = ["Efectivo", "Transferencia", "QR", "Mixto"]

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
            placeholder="Buscar productos por nombre o código..."
            className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
          />
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            Todas las categorías
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <button
              key={product.id}
              className="rounded-[24px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {product.category}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Stock: {product.stock}
                </span>
              </div>

              <h3 className="text-base font-semibold text-slate-900">
                {product.name}
              </h3>

              <p className="mt-3 text-2xl font-bold tracking-tight text-blue-700">
                {product.price}
              </p>
            </button>
          ))}
        </div>
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
          {cart.map((item) => (
            <div
              key={item.id}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.unitPrice} por unidad</p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  x{item.qty}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    -
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    +
                  </button>
                </div>

                <p className="text-lg font-bold text-slate-950">{item.subtotal}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Método de pago
          </p>

          <div className="grid grid-cols-2 gap-3">
            {payments.map((payment, index) => (
              <button
                key={payment}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  index === 0
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {payment}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Total general
          </p>
          <h3 className="mt-2 text-5xl font-bold tracking-tight">Gs. 40.000</h3>
          <p className="mt-2 text-sm text-slate-400">4 productos en la venta actual</p>
        </div>

        <div className="mt-6 grid gap-3">
          <button className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            Confirmar venta
          </button>
          <button className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Cancelar venta
          </button>
        </div>
      </section>
    </div>
  )
}

function StockView() {
  const stockData = [
    {
      id: 1,
      name: "Cerveza Pilsen 1L",
      provider: "Distribuidora Central",
      currentStock: 24,
      minStock: 10,
    },
    {
      id: 2,
      name: "Coca-Cola 500ml",
      provider: "Bebidas Santa Ana",
      currentStock: 8,
      minStock: 12,
    },
    {
      id: 3,
      name: "Agua Mineral 600ml",
      provider: "Bebidas Santa Ana",
      currentStock: 30,
      minStock: 10,
    },
    {
      id: 4,
      name: "Monster Energy",
      provider: "Global Drinks",
      currentStock: 5,
      minStock: 8,
    },
    {
      id: 5,
      name: "Papas Chips",
      provider: "NatureFoods",
      currentStock: 18,
      minStock: 6,
    },
    {
      id: 6,
      name: "Hielo 2kg",
      provider: "Distribuidora Central",
      currentStock: 3,
      minStock: 8,
    },
  ]

  const inventoryValue = "Gs. 3.480.000"

  const getStatus = (currentStock: number, minStock: number) => {
    if (currentStock <= Math.floor(minStock * 0.7)) {
      return {
        label: "Crítico",
        className: "bg-red-100 text-red-700",
      }
    }

    if (currentStock <= minStock) {
      return {
        label: "Bajo",
        className: "bg-amber-100 text-amber-700",
      }
    }

    return {
      label: "Óptimo",
      className: "bg-emerald-100 text-emerald-700",
    }
  }

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
            Control general del inventario, alertas de reposición y visión rápida del estado actual.
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
          <h3 className="mt-4 text-5xl font-bold tracking-tight text-red-700">03</h3>
          <p className="mt-2 text-sm text-red-500">Requiere acción inmediata</p>
        </div>

        <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Stock bajo
          </p>
          <h3 className="mt-4 text-5xl font-bold tracking-tight text-amber-700">02</h3>
          <p className="mt-2 text-sm text-amber-600">Programar reposición</p>
        </div>

        <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Valor inventario
          </p>
          <h3 className="mt-4 text-4xl font-bold tracking-tight text-emerald-700">
            {inventoryValue}
          </h3>
          <p className="mt-2 text-sm text-emerald-600">Estimación actual del stock</p>
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
            {stockData.length} productos encontrados
          </span>
        </div>

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
              {stockData.map((item) => {
                const status = getStatus(item.currentStock, item.minStock)

                return (
                  <tr key={item.id} className="rounded-2xl bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          Código: PR-{String(item.id).padStart(3, "0")}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">{item.provider}</td>

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.currentStock}
                    </td>

                    <td className="px-4 py-4 text-slate-600">{item.minStock}</td>

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
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ProductsView() {
  const products = [
    {
      id: 1,
      name: "Cerveza Pilsen 1L",
      category: "Bebidas",
      provider: "Distribuidora Central",
      salePrice: "Gs. 12.000",
      costPrice: "Gs. 8.500",
      stock: 24,
      minStock: 10,
      status: "Activo",
    },
    {
      id: 2,
      name: "Coca-Cola 500ml",
      category: "Gaseosas",
      provider: "Bebidas Santa Ana",
      salePrice: "Gs. 7.000",
      costPrice: "Gs. 4.800",
      stock: 8,
      minStock: 12,
      status: "Activo",
    },
    {
      id: 3,
      name: "Agua Mineral 600ml",
      category: "Aguas",
      provider: "Bebidas Santa Ana",
      salePrice: "Gs. 5.000",
      costPrice: "Gs. 3.200",
      stock: 30,
      minStock: 10,
      status: "Activo",
    },
    {
      id: 4,
      name: "Monster Energy",
      category: "Energéticas",
      provider: "Global Drinks",
      salePrice: "Gs. 14.000",
      costPrice: "Gs. 9.800",
      stock: 5,
      minStock: 8,
      status: "Activo",
    },
    {
      id: 5,
      name: "Papas Chips",
      category: "Snacks",
      provider: "NatureFoods",
      salePrice: "Gs. 6.000",
      costPrice: "Gs. 3.500",
      stock: 18,
      minStock: 6,
      status: "Activo",
    },
  ]

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
            Administración del catálogo principal de la bodega con precios, stock y proveedor.
          </p>
        </div>

        <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
          Nuevo producto
        </button>
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
              Todas las categorías
            </button>

            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              Todos los estados
            </button>
          </div>

          <span className="text-sm font-medium text-slate-500">
            {products.length} productos cargados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Categoría</th>
                <th className="pb-2">Proveedor</th>
                <th className="pb-2">Precio venta</th>
                <th className="pb-2">Costo proveedor</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Mínimo</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Acción</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const lowStock = product.stock <= product.minStock

                return (
                  <tr key={product.id} className="rounded-2xl bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">
                          Código: PR-{String(product.id).padStart(3, "0")}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">{product.category}</td>
                    <td className="px-4 py-4 text-slate-600">{product.provider}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {product.salePrice}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{product.costPrice}</td>

                    <td
                      className={`px-4 py-4 font-semibold ${
                        lowStock ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {product.stock}
                    </td>

                    <td className="px-4 py-4 text-slate-600">{product.minStock}</td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {product.status}
                      </span>
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                          Ver
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function IngresosView() {
  const providers = [
    { id: 1, name: "Distribuidora Central" },
    { id: 2, name: "Bebidas Santa Ana" },
    { id: 3, name: "Global Drinks" },
  ]

  const ingresoItems = [
    {
      id: 1,
      product: "Cerveza Pilsen 1L",
      quantity: 12,
      unitCost: "Gs. 8.500",
      subtotal: "Gs. 102.000",
    },
    {
      id: 2,
      product: "Coca-Cola 500ml",
      quantity: 10,
      unitCost: "Gs. 4.800",
      subtotal: "Gs. 48.000",
    },
    {
      id: 3,
      product: "Hielo 2kg",
      quantity: 8,
      unitCost: "Gs. 7.000",
      subtotal: "Gs. 56.000",
    },
  ]

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
            Registro de productos recibidos desde proveedor, tanto en consignación como en compra directa.
          </p>
        </div>

        <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
          Guardar ingreso
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

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Proveedor
              </label>
              <select className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white">
                {providers.map((provider) => (
                  <option key={provider.id}>{provider.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tipo de ingreso
              </label>
              <select className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white">
                <option>Consignación</option>
                <option>Compra directa</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Fecha
              </label>
              <input
                type="date"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observaciones
              </label>
              <textarea
                placeholder="Ej.: reposición para fin de semana, entrega parcial, etc."
                className="min-h-[130px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>

            <div className="grid gap-3">
              <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
                Confirmar ingreso
              </button>
              <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
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

            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              Agregar fila
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
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
                {ingresoItems.map((item) => (
                  <tr key={item.id} className="rounded-2xl bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-900">
                      {item.product}
                    </td>

                    <td className="px-4 py-4 text-slate-700">{item.quantity}</td>

                    <td className="px-4 py-4 text-slate-700">{item.unitCost}</td>

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.subtotal}
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Total del ingreso
            </p>
            <h3 className="mt-2 text-4xl font-bold tracking-tight">Gs. 206.000</h3>
            <p className="mt-2 text-sm text-slate-400">
              3 productos registrados en este ingreso
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function LiquidacionesView() {
  const providers = [
    { id: 1, name: "Distribuidora Central" },
    { id: 2, name: "Bebidas Santa Ana" },
    { id: 3, name: "Global Drinks" },
  ]

  const liquidationData = [
    {
      id: 1,
      product: "Cerveza Pilsen 1L",
      received: 120,
      sold: 88,
      remaining: 32,
      unitCost: "Gs. 8.500",
      total: "Gs. 748.000",
    },
    {
      id: 2,
      product: "Coca-Cola 500ml",
      received: 80,
      sold: 62,
      remaining: 18,
      unitCost: "Gs. 4.800",
      total: "Gs. 297.600",
    },
    {
      id: 3,
      product: "Agua Mineral 600ml",
      received: 100,
      sold: 74,
      remaining: 26,
      unitCost: "Gs. 3.200",
      total: "Gs. 236.800",
    },
    {
      id: 4,
      product: "Monster Energy",
      received: 50,
      sold: 38,
      remaining: 12,
      unitCost: "Gs. 9.800",
      total: "Gs. 372.400",
    },
  ]

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
            Cálculo mensual de productos recibidos, vendidos y saldo pendiente con el proveedor.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Exportar PDF
          </button>
          <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            Finalizar liquidación
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.72fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <select className="h-12 min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white">
                {providers.map((provider) => (
                  <option key={provider.id}>{provider.name}</option>
                ))}
              </select>

              <select className="h-12 min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white">
                <option>Marzo 2026</option>
                <option>Febrero 2026</option>
                <option>Enero 2026</option>
              </select>
            </div>

            <span className="text-sm font-medium text-slate-500">
              {liquidationData.length} productos en liquidación
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Recibido</th>
                  <th className="pb-2">Vendido</th>
                  <th className="pb-2">Restante</th>
                  <th className="pb-2">Costo unitario</th>
                  <th className="pb-2">Total a pagar</th>
                </tr>
              </thead>

              <tbody>
                {liquidationData.map((item) => (
                  <tr key={item.id} className="rounded-2xl bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.product}</p>
                        <p className="text-sm text-slate-500">
                          Código: PR-{String(item.id).padStart(3, "0")}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-700">{item.received}</td>

                    <td className="px-4 py-4 font-semibold text-emerald-700">
                      {item.sold}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {item.remaining}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-700">{item.unitCost}</td>

                    <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-950">
                      {item.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Resumen
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Cuenta del período
            </h3>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Proveedor</span>
                <span className="font-semibold text-slate-900">
                  Distribuidora Central
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Período</span>
                <span className="font-semibold text-slate-900">Marzo 2026</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Productos liquidados</span>
                <span className="font-semibold text-slate-900">4</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total vendido</span>
                <span className="font-semibold text-emerald-700">262 unidades</span>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Total a pagar
              </p>
              <h3 className="mt-2 text-4xl font-bold tracking-tight">
                Gs. 1.654.800
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Monto pendiente según productos efectivamente vendidos
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
                Confirmar cierre
              </button>
              <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Descargar resumen
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Nota
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Este módulo será uno de los más importantes cuando conectemos la base de datos,
              porque aquí se calculará automáticamente cuánto se recibió, cuánto se vendió y cuánto se debe pagar al proveedor.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Content({ active }: { active: ModuleKey }) {
  switch (active) {
    case "dashboard":
  return <DashboardView />
    case "ventas":
  return <SalesView />
    case "productos":
  return <ProductsView />
    case "categorias":
      return (
        <PlaceholderPage
          eyebrow="Organización"
          title="Categorías"
          description="Aquí irá el módulo para gestionar categorías como cervezas, gaseosas, aguas, energéticas, snacks e hielo."
        />
      );
    case "stock":
  return <StockView />
    case "ingresos":
  return <IngresosView />
    case "proveedores":
      return (
        <PlaceholderPage
          eyebrow="Relación comercial"
          title="Proveedores"
          description="Aquí irá el módulo para consultar deuda, tipo de acuerdo e historial por proveedor."
        />
      );
    case "liquidaciones":
  return <LiquidacionesView />
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
