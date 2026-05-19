import { Router } from 'express'
import { Rol } from '@prisma/client'
import { prisma } from '../config/prisma'
import { roleMiddleware } from '../middlewares/role.middleware'

const router = Router()
const adminOnly = roleMiddleware([Rol.ADMIN])

function resolvePackPricing(body: any, current?: any) {
  const manejaPack =
    body.manejaPack !== undefined ? Boolean(body.manejaPack) : Boolean(current?.manejaPack)
  const unidadesPorPack = manejaPack
    ? Number(body.unidadesPorPack ?? current?.unidadesPorPack)
    : 1

  if (manejaPack && (!Number.isFinite(unidadesPorPack) || unidadesPorPack <= 0)) {
    throw new Error('Debes indicar cuantas unidades tiene el pack')
  }

  const previousUnits = current?.unidadesPorPack || 1
  const costoPack = Number(
    body.costoPack ??
      (body.costoProveedor !== undefined ? Number(body.costoProveedor) * unidadesPorPack : undefined) ??
      current?.costoPack ??
      (current?.costoProveedor !== undefined ? current.costoProveedor * previousUnits : undefined)
  )
  const precioVentaPack = Number(
    body.precioVentaPack ??
      (body.precioVenta !== undefined ? Number(body.precioVenta) * unidadesPorPack : undefined) ??
      current?.precioVentaPack ??
      (current?.precioVenta !== undefined ? current.precioVenta * previousUnits : undefined)
  )

  if (
    !Number.isFinite(costoPack) ||
    !Number.isFinite(precioVentaPack) ||
    costoPack < 0 ||
    precioVentaPack < 0
  ) {
    throw new Error('Costo pack y precio venta pack son obligatorios')
  }

  return {
    manejaPack,
    unidadesPorPack: manejaPack ? unidadesPorPack : null,
    costoPack,
    precioVentaPack,
    costoProveedor: costoPack / unidadesPorPack,
    precioVenta: precioVentaPack / unidadesPorPack,
  }
}

router.get('/', async (_req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        proveedor: true,
      },
      orderBy: {
        id: 'desc',
      },
    })

    res.json(productos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto invalido',
      })
    }

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        proveedor: true,
      },
    })

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado',
      })
    }

    res.json(producto)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el producto' })
  }
})

router.post('/', adminOnly, async (req, res) => {
  try {
    const {
      nombre,
      codigo,
      stockActual,
      stockMinimo,
      activo,
      categoriaId,
      proveedorId,
    } = req.body

    if (!nombre || !codigo || categoriaId === undefined || proveedorId === undefined) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
      })
    }

    const nuevaCategoria = await prisma.categoria.findUnique({
      where: { id: Number(categoriaId) },
    })

    if (!nuevaCategoria) {
      return res.status(400).json({
        error: 'La categoria no existe',
      })
    }

    const nuevoProveedor = await prisma.proveedor.findUnique({
      where: { id: Number(proveedorId) },
    })

    if (!nuevoProveedor) {
      return res.status(400).json({
        error: 'El proveedor no existe',
      })
    }

    const pricing = resolvePackPricing(req.body)

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre: String(nombre).trim(),
        codigo: String(codigo).trim(),
        precioVenta: pricing.precioVenta,
        costoProveedor: pricing.costoProveedor,
        precioVentaPack: pricing.precioVentaPack,
        costoPack: pricing.costoPack,
        stockActual: stockActual !== undefined ? Number(stockActual) : 0,
        stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : 0,
        activo: activo !== undefined ? Boolean(activo) : true,
        categoriaId: Number(categoriaId),
        proveedorId: Number(proveedorId),
        manejaPack: pricing.manejaPack,
        unidadesPorPack: pricing.unidadesPorPack,
      },
      include: {
        categoria: true,
        proveedor: true,
      },
    })

    res.status(201).json(nuevoProducto)
  } catch (error: any) {
    console.error(error)

    if (error.message?.includes('pack')) {
      return res.status(400).json({ error: error.message })
    }

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe un producto con ese codigo',
      })
    }

    res.status(500).json({
      error: 'Error al crear producto',
    })
  }
})

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto invalido',
      })
    }

    const {
      nombre,
      codigo,
      stockActual,
      stockMinimo,
      activo,
      categoriaId,
      proveedorId,
    } = req.body

    const productoExistente = await prisma.producto.findUnique({
      where: { id },
    })

    if (!productoExistente) {
      return res.status(404).json({
        error: 'Producto no encontrado',
      })
    }

    const pricing = resolvePackPricing(req.body, productoExistente)

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? String(nombre).trim() : undefined,
        codigo: codigo !== undefined ? String(codigo).trim() : undefined,
        precioVenta: pricing.precioVenta,
        costoProveedor: pricing.costoProveedor,
        precioVentaPack: pricing.precioVentaPack,
        costoPack: pricing.costoPack,
        stockActual: stockActual !== undefined ? Number(stockActual) : undefined,
        stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : undefined,
        activo: activo !== undefined ? Boolean(activo) : undefined,
        categoriaId: categoriaId !== undefined ? Number(categoriaId) : undefined,
        proveedorId: proveedorId !== undefined ? Number(proveedorId) : undefined,
        manejaPack: pricing.manejaPack,
        unidadesPorPack: pricing.unidadesPorPack,
      },
      include: {
        categoria: true,
        proveedor: true,
      },
    })

    res.json(productoActualizado)
  } catch (error: any) {
    console.error(error)

    if (error.message?.includes('pack')) {
      return res.status(400).json({ error: error.message })
    }

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe un producto con ese codigo',
      })
    }

    res.status(500).json({
      error: 'Error al actualizar producto',
    })
  }
})

router.patch('/:id/estado', adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto invalido',
      })
    }

    const { activo } = req.body

    if (activo === undefined) {
      return res.status(400).json({
        error: 'Debes enviar el campo activo',
      })
    }

    const productoExistente = await prisma.producto.findUnique({
      where: { id },
    })

    if (!productoExistente) {
      return res.status(404).json({
        error: 'Producto no encontrado',
      })
    }

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: {
        activo: Boolean(activo),
      },
      include: {
        categoria: true,
        proveedor: true,
      },
    })

    res.json(productoActualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al cambiar el estado del producto',
    })
  }
})

router.patch('/:id/ajustar-stock', adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto invalido',
      })
    }

    const { tipoAjuste, cantidad, observacion } = req.body

    if (!tipoAjuste || cantidad === undefined) {
      return res.status(400).json({
        error: 'Debes enviar tipoAjuste y cantidad',
      })
    }

    const cantidadNumero = Number(cantidad)

    if (isNaN(cantidadNumero) || cantidadNumero < 0) {
      return res.status(400).json({
        error: 'La cantidad debe ser un numero valido mayor o igual a 0',
      })
    }

    const productoExistente = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        proveedor: true,
      },
    })

    if (!productoExistente) {
      return res.status(404).json({
        error: 'Producto no encontrado',
      })
    }

    let nuevoStock = productoExistente.stockActual

    if (tipoAjuste === 'SUMAR') {
      nuevoStock = productoExistente.stockActual + cantidadNumero
    } else if (tipoAjuste === 'RESTAR') {
      nuevoStock = productoExistente.stockActual - cantidadNumero
    } else if (tipoAjuste === 'FIJAR') {
      nuevoStock = cantidadNumero
    } else {
      return res.status(400).json({
        error: 'Tipo de ajuste invalido',
      })
    }

    if (nuevoStock < 0) {
      return res.status(400).json({
        error: 'El stock no puede quedar en negativo',
      })
    }

    const diferencia = nuevoStock - productoExistente.stockActual

    const resultado = await prisma.$transaction(async (tx) => {
      const productoActualizado = await tx.producto.update({
        where: { id },
        data: {
          stockActual: nuevoStock,
        },
        include: {
          categoria: true,
          proveedor: true,
        },
      })

      await tx.movimientoInventario.create({
        data: {
          tipoMovimiento: 'AJUSTE',
          cantidad: diferencia,
          stockAnterior: productoExistente.stockActual,
          stockNuevo: nuevoStock,
          referenciaTipo: 'AJUSTE_MANUAL',
          referenciaId: id,
          observacion:
            observacion && String(observacion).trim() !== ''
              ? String(observacion).trim()
              : `Ajuste manual de stock (${tipoAjuste})`,
          productoId: id,
        },
      })

      return productoActualizado
    })

    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al ajustar el stock',
    })
  }
})

export default router
