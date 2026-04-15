import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

const pdfMakeAny = pdfMake as any;
const pdfFontsAny = pdfFonts as any;

pdfMakeAny.vfs = pdfFontsAny.vfs;

function formatGsPdf(value: number) {
  return `Gs. ${value.toLocaleString("es-PY")}`;
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
      liquidacionPack: "Por unidad",
      stockPack: "—",
    };
  }

  const packsALiquidar = Math.ceil(cantidadVendida / unidadesPorPack);
  const unidadesLiquidadas = packsALiquidar * unidadesPorPack;

  return {
    packLabel: `${unidadesPorPack} u.`,
    packsIngresados: formatPackBreakdown(cantidadIngresada, unidadesPorPack),
    liquidacionPack: `${packsALiquidar} pack${packsALiquidar === 1 ? "" : "s"} / ${unidadesLiquidadas} u.`,
    stockPack: formatPackBreakdown(stockActual, unidadesPorPack),
  };
}

export function generarPDFLiquidacion(liquidacion: any) {
  const rows = liquidacion.detalles.map((item: any) => {
    const packInfo = getPackMetrics({
      cantidadIngresada: item.cantidadRecibida,
      cantidadVendida: item.cantidadVendida,
      stockActual: item.cantidadRestante,
      manejaPack: item.producto.manejaPack,
      unidadesPorPack: item.producto.unidadesPorPack,
    });

    return [
      { text: item.producto.nombre, style: "tableCellLeft" },
      { text: `${item.cantidadRecibida} u.`, style: "tableCellCenter" },
      { text: `${item.cantidadVendida} u.`, style: "tableCellCenter" },
      { text: packInfo.packLabel, style: "tableCellCenter" },
      { text: packInfo.packsIngresados, style: "tableCellCenter" },
      { text: packInfo.liquidacionPack, style: "tableCellCenterBlue" },
      { text: packInfo.stockPack, style: "tableCellCenter" },
      { text: formatGsPdf(item.costoUnitario), style: "tableCellRight" },
      { text: formatGsPdf(item.subtotal), style: "tableCellRightBold" },
    ];
  });

  const docDefinition: any = {
    pageSize: "A3",
    pageOrientation: "landscape",
    pageMargins: [18, 24, 18, 24],

    content: [
      {
        text: `Liquidación #${liquidacion.id}`,
        style: "header",
      },
      {
        text: liquidacion.proveedor.nombre,
        style: "subheader",
      },
      {
        columns: [
          [
            { text: `Período: ${liquidacion.periodo}`, style: "meta" },
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
          widths: [190, 70, 65, 58, 115, 125, 105, 88, 100],
          body: [
            [
              { text: "Producto", style: "tableHeaderLeft" },
              { text: "Ingresado", style: "tableHeaderCenter" },
              { text: "Vendido", style: "tableHeaderCenter" },
              { text: "Pack", style: "tableHeaderCenter" },
              { text: "Packs ing.", style: "tableHeaderCenter" },
              { text: "Liquidación", style: "tableHeaderCenter" },
              { text: "Stock pack", style: "tableHeaderCenter" },
              { text: "Costo", style: "tableHeaderCenter" },
              { text: "Subtotal", style: "tableHeaderRight" },
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
          "Nota: Los productos configurados por pack se liquidan redondeando hacia arriba al pack completo. Por eso las unidades liquidadas y el total pueden ser mayores que las unidades vendidas reales.",
        style: "warningNote",
      },
      {
        text: `Total liquidado: ${formatGsPdf(liquidacion.totalPagar)}`,
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
        fillColor: "#2563eb",
        alignment: "left",
      },
      tableHeaderCenter: {
        bold: true,
        fontSize: 9,
        color: "#ffffff",
        fillColor: "#2563eb",
        alignment: "center",
      },
      tableHeaderRight: {
        bold: true,
        fontSize: 9,
        color: "#ffffff",
        fillColor: "#2563eb",
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
      tableCellCenterBlue: {
        fontSize: 9,
        color: "#1d4ed8",
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
      warningNote: {
        fontSize: 10,
        color: "#92400e",
        fillColor: "#fef3c7",
        margin: [0, 0, 0, 0],
      },
      total: {
        margin: [0, 18, 0, 0],
        fontSize: 20,
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