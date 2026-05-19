import { Router } from 'express'
import { prisma } from '../config/prisma'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const ingresos = await prisma.ingresoMercaderia.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    res.json(ingresos)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener ingresos',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de ingreso invalido',
      })
    }

    const ingreso = await prisma.ingresoMercaderia.findUnique({
      where: { id },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    if (!ingreso) {
      return res.status(404).json({
        error: 'Ingreso no encontrado',
      })
    }

    res.json(ingreso)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener el ingreso',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { proveedorId, tipoIngreso, observacion, detalles } = req.body

    if (!tipoIngreso || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        error: 'Datos incompletos para registrar el ingreso',
      })
    }

    const proveedor = proveedorId
      ? await prisma.proveedor.findUnique({
          where: {
            id: Number(proveedorId),
          },
        })
      : await prisma.proveedor.findFirst({
          where: {
            activo: true,
            predeterminado: true,
          },
          orderBy: {
            id: 'asc',
          },
        })

    if (!proveedor) {
      return res.status(400).json({
        error: proveedorId
          ? 'Proveedor no encontrado'
          : 'No hay proveedor predeterminado activo configurado',
      })
    }

    if (!proveedor.activo) {
      return res.status(400).json({
        error: 'El proveedor seleccionado no está activo',
      })
    }

    const tiposValidos = ['CONSIGNACION', 'COMPRA_DIRECTA']

    if (!tiposValidos.includes(tipoIngreso)) {
      return res.status(400).json({
        error: 'Tipo de ingreso invalido',
      })
    }

    const productosIds = detalles.map((item: any) => Number(item.productoId))

    const productos = await prisma.producto.findMany({
      where: {
        id: {
          in: productosIds,
        },
      },
    })

    if (productos.length !== productosIds.length) {
      return res.status(400).json({
        error: 'Uno o mas productos no existen',
      })
    }

    const ingreso = await prisma.$transaction(async (tx) => {
      const nuevoIngreso = await tx.ingresoMercaderia.create({
        data: {
          proveedorId: proveedor.id,
          tipoIngreso,
          observacion: observacion ? String(observacion).trim() : null,
        },
      })

      for (const item of detalles) {
        const productoId = Number(item.productoId)
        const productoActual = productos.find((producto) => producto.id === productoId)

        if (!productoActual) {
          throw new Error('Producto no encontrado')
        }

        const unidadesPorPack =
          productoActual.manejaPack && productoActual.unidadesPorPack
            ? productoActual.unidadesPorPack
            : 1
        const cantidadPacks =
          item.cantidadPacks !== undefined ? Number(item.cantidadPacks) : Number(item.cantidad)
        const costoPack =
          item.costoPack !== undefined
            ? Number(item.costoPack)
            : Number(item.costoUnitario) * unidadesPorPack
        const cantidadUnidades = cantidadPacks * unidadesPorPack
        const costoUnitario = costoPack / unidadesPorPack

        if (
          !productoId ||
          !Number.isFinite(cantidadPacks) ||
          cantidadPacks <= 0 ||
          !Number.isFinite(costoPack) ||
          costoPack < 0
        ) {
          throw new Error('Detalle de ingreso invalido')
        }

        const subtotal = cantidadUnidades * costoUnitario

        await tx.detalleIngresoMercaderia.create({
          data: {
            ingresoId: nuevoIngreso.id,
            productoId,
            cantidad: cantidadUnidades,
            costoUnitario,
            subtotal,
          },
        })

        await tx.producto.update({
          where: {
            id: productoId,
          },
          data: {
            stockActual: {
              increment: cantidadUnidades,
            },
          },
        })

        await tx.movimientoInventario.create({
          data: {
            productoId,
            tipoMovimiento: 'ENTRADA',
            cantidad: cantidadUnidades,
            stockAnterior: productoActual.stockActual,
            stockNuevo: productoActual.stockActual + cantidadUnidades,
            referenciaTipo: 'INGRESO',
            referenciaId: nuevoIngreso.id,
            observacion: productoActual.manejaPack
              ? `Ingreso de mercaderia #${nuevoIngreso.id}: ${cantidadPacks} packs x ${unidadesPorPack} unidades = ${cantidadUnidades} unidades`
              : `Ingreso de mercaderia #${nuevoIngreso.id}: ${cantidadUnidades} unidades`,
          },
        })
      }

      return nuevoIngreso
    })

    const ingresoCompleto = await prisma.ingresoMercaderia.findUnique({
      where: {
        id: ingreso.id,
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    res.status(201).json(ingresoCompleto)
  } catch (error: any) {
    console.error(error)

    if (error.message === 'Detalle de ingreso invalido') {
      return res.status(400).json({
        error: 'Uno de los detalles del ingreso es invalido',
      })
    }

    res.status(500).json({
      error: 'Error al registrar el ingreso',
    })
  }
})

export default router
