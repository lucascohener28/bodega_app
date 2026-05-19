import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

const pdfMakeAny = pdfMake as any;
const pdfFontsAny = pdfFonts as any;

pdfMakeAny.vfs = pdfFontsAny.vfs;

function formatGsPdf(value: number) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;

  return `Gs. ${amount.toLocaleString("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatPackBreakdown(unidades: number, unidadesPorPack: number | null) {
  if (!unidadesPorPack || unidadesPorPack <= 0) return "-";

  const packsCompletos = Math.floor(unidades / unidadesPorPack);
  const unidadesSueltas = unidades % unidadesPorPack;

  if (packsCompletos === 0 && unidadesSueltas === 0) return "0 packs";
  if (unidadesSueltas === 0) {
    return `${packsCompletos} pack${packsCompletos === 1 ? "" : "s"}`;
  }
  if (packsCompletos === 0) return `${unidadesSueltas} u.`;
  return `${packsCompletos} pack${packsCompletos === 1 ? "" : "s"} + ${unidadesSueltas} u.`;
}

function getPackMetrics(params: {
  cantidadIngresada: number;
  cantidadVendida: number;
  stockActual: number;
  manejaPack: boolean;
  unidadesPorPack: number | null;
  subtotalProveedor?: number;
  costoUnitario?: number;
  costoPack?: number | null;
}) {
  const {
    cantidadIngresada,
    cantidadVendida,
    stockActual,
    manejaPack,
    unidadesPorPack,
    subtotalProveedor = 0,
    costoUnitario = 0,
    costoPack = null,
  } = params;

  if (!manejaPack || !unidadesPorPack || unidadesPorPack <= 0) {
    return {
      packsIngresados: "-",
      vendidoConUnidades: `${cantidadVendida} u.`,
      packsACobrar: `${cantidadVendida} u.`,
      costoPackDisplay: formatGsPdf(costoUnitario),
      stockDisplay: `${stockActual} u.`,
    };
  }

  const packsACobrarNumero = Math.ceil(cantidadVendida / unidadesPorPack);
  const packsACobrar = `${packsACobrarNumero} pack${
    packsACobrarNumero === 1 ? "" : "s"
  }`;
  const costoPackReal =
    packsACobrarNumero > 0 && subtotalProveedor > 0
      ? subtotalProveedor / packsACobrarNumero
      : typeof costoPack === "number" && Number.isFinite(costoPack)
        ? costoPack
        : costoUnitario * unidadesPorPack;
  const vendido = formatPackBreakdown(cantidadVendida, unidadesPorPack);
  const stock = formatPackBreakdown(stockActual, unidadesPorPack);

  return {
    packsIngresados: formatPackBreakdown(cantidadIngresada, unidadesPorPack),
    vendidoConUnidades: `${vendido} (${cantidadVendida} u.)`,
    packsACobrar,
    costoPackDisplay: formatGsPdf(costoPackReal),
    stockDisplay: `${stock} (${stockActual} u.)`,
  };
}

export function generarPDFLiquidacion(liquidacion: any) {
  const ventas = liquidacion.detallesVenta ?? [];
  const totalVendido = ventas.reduce(
    (acc: number, item: any) => acc + item.subtotal,
    0
  );

  const rows = liquidacion.detalles.map((item: any) => {
    const ventaTotal = ventas
      .filter((venta: any) => venta.productoId === item.producto.id)
      .reduce((acc: number, venta: any) => acc + venta.subtotal, 0);
    const packInfo = getPackMetrics({
      cantidadIngresada: item.cantidadRecibida,
      cantidadVendida: item.cantidadVendida,
      stockActual: item.cantidadRestante,
      manejaPack: item.producto.manejaPack,
      unidadesPorPack: item.producto.unidadesPorPack,
      subtotalProveedor: item.subtotal,
      costoUnitario: item.costoUnitario,
      costoPack: item.producto.costoPack,
    });
    const ganancia = ventaTotal - item.subtotal;

    return [
      { text: item.producto.nombre, style: "tableCellLeft" },
      { text: packInfo.vendidoConUnidades, style: "tableCellCenterBrand" },
      { text: packInfo.packsACobrar, style: "tableCellCenter" },
      { text: packInfo.costoPackDisplay, style: "tableCellRight" },
      { text: packInfo.stockDisplay, style: "tableCellCenter" },
      { text: formatGsPdf(ventaTotal), style: "tableCellRight" },
      { text: formatGsPdf(item.subtotal), style: "tableCellRightBold" },
      { text: formatGsPdf(ganancia), style: "tableCellRightBoldBrand" },
    ];
  });

  const docDefinition: any = {
    pageSize: "A3",
    pageOrientation: "landscape",
    pageMargins: [18, 24, 18, 24],

    content: [
      { text: `Liquidacion #${liquidacion.id}`, style: "header" },
      { text: liquidacion.proveedor.nombre, style: "subheader" },
      {
        columns: [
          [
            { text: `Periodo: ${liquidacion.periodo}`, style: "meta" },
            {
              text: `Fecha de registro: ${new Date(
                liquidacion.createdAt
              ).toLocaleString("es-PY")}`,
              style: "meta",
            },
            {
              text: `Fecha de cierre: ${new Date(
                liquidacion.fechaCierre ?? liquidacion.updatedAt
              ).toLocaleString("es-PY")}`,
              style: "meta",
            },
          ],
        ],
        margin: [0, 10, 0, 18],
      },
      {
        table: {
          headerRows: 1,
          widths: [210, 160, 95, 95, 130, 100, 110, 100],
          body: [
            [
              { text: "Producto", style: "tableHeaderLeft" },
              { text: "Vendido", style: "tableHeaderCenter" },
              { text: "Packs cobrados", style: "tableHeaderCenter" },
              { text: "Costo pack", style: "tableHeaderCenter" },
              { text: "Stock restante", style: "tableHeaderCenter" },
              { text: "Total vendido", style: "tableHeaderRight" },
              { text: "Pago proveedor", style: "tableHeaderRight" },
              { text: "Ganancia", style: "tableHeaderRight" },
            ],
            ...rows,
          ],
        },
        layout: {
          fillColor: function (rowIndex: number) {
            if (rowIndex === 0) return null;
            return rowIndex % 2 === 0 ? "#f8fafc" : "#ffffff";
          },
          hLineColor: () => "#e2e8f0",
          vLineColor: () => "#e2e8f0",
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },
      {
        margin: [0, 14, 0, 0],
        text:
          "Nota: Los productos por pack se liquidan redondeando hacia arriba al pack completo cuando hay unidades sueltas.",
        style: "warningNote",
      },
      {
        text: `Total vendido: ${formatGsPdf(totalVendido)}   |   Pago proveedor: ${formatGsPdf(liquidacion.totalPagar)}   |   Ganancia: ${formatGsPdf(totalVendido - liquidacion.totalPagar)}`,
        style: "total",
      },
      {
        text: liquidacion.observacion || "Sin observaciones",
        style: "note",
      },
    ],

    styles: {
      header: {
        fontSize: 26,
        bold: true,
        color: "#1e293b",
        margin: [0, 0, 0, 5],
      },
      subheader: {
        fontSize: 16,
        color: "#475569",
        margin: [0, 0, 0, 10],
      },
      meta: {
        fontSize: 10,
        color: "#334155",
        margin: [0, 2, 0, 2],
      },
      tableHeaderLeft: {
        bold: true,
        fontSize: 9,
        color: "#ffffff",
        fillColor: "#588100",
        alignment: "left",
      },
      tableHeaderCenter: {
        bold: true,
        fontSize: 9,
        color: "#ffffff",
        fillColor: "#588100",
        alignment: "center",
      },
      tableHeaderRight: {
        bold: true,
        fontSize: 9,
        color: "#ffffff",
        fillColor: "#588100",
        alignment: "right",
      },
      tableCellLeft: {
        fontSize: 9,
        color: "#0f172a",
        alignment: "left",
      },
      tableCellCenter: {
        fontSize: 9,
        color: "#0f172a",
        alignment: "center",
      },
      tableCellCenterBrand: {
        fontSize: 9,
        color: "#456600",
        bold: true,
        alignment: "center",
      },
      tableCellRight: {
        fontSize: 9,
        color: "#0f172a",
        alignment: "right",
      },
      tableCellRightBold: {
        fontSize: 9,
        color: "#0f172a",
        bold: true,
        alignment: "right",
      },
      tableCellRightBoldBrand: {
        fontSize: 9,
        color: "#456600",
        bold: true,
        alignment: "right",
      },
      warningNote: {
        fontSize: 10,
        color: "#92400e",
        fillColor: "#fef3c7",
      },
      total: {
        margin: [0, 18, 0, 0],
        fontSize: 18,
        bold: true,
        alignment: "right",
        color: "#0f172a",
      },
      note: {
        margin: [0, 10, 0, 0],
        fontSize: 10,
        color: "#64748b",
      },
    },

    defaultStyle: {
      fontSize: 10,
    },
  };

  pdfMakeAny.createPdf(docDefinition).download(
    `liquidacion_${liquidacion.id}.pdf`
  );
}
