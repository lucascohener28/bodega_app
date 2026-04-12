import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

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
        error: 'ID de producto inválido',
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

router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      codigo,
      precioVenta,
      costoProveedor,
      stockActual,
      stockMinimo,
      activo,
      categoriaId,
      proveedorId,
      manejaPack,
      unidadesPorPack,
    } = req.body

    if (
      !nombre ||
      !codigo ||
      precioVenta === undefined ||
      costoProveedor === undefined ||
      categoriaId === undefined ||
      proveedorId === undefined
    ) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
      })
    }

    const nuevaCategoria = await prisma.categoria.findUnique({
      where: { id: Number(categoriaId) },
    })

    if (!nuevaCategoria) {
      return res.status(400).json({
        error: 'La categoría no existe',
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

    const nuevoProducto = await prisma.producto.create({
  data: {
    nombre: String(nombre).trim(),
    codigo: String(codigo).trim(),
    precioVenta: Number(precioVenta),
    costoProveedor: Number(costoProveedor),
    stockActual: stockActual !== undefined ? Number(stockActual) : 0,
    stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : 0,
    activo: activo !== undefined ? Boolean(activo) : true,
    categoriaId: Number(categoriaId),
    proveedorId: Number(proveedorId),
    manejaPack: manejaPack !== undefined ? Boolean(manejaPack) : false,
    unidadesPorPack:
      manejaPack !== undefined && Boolean(manejaPack)
        ? Number(unidadesPorPack)
        : null,
  },
  include: {
    categoria: true,
    proveedor: true,
  },
})

    res.status(201).json(nuevoProducto)
  } catch (error: any) {
    console.error(error)

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe un producto con ese código',
      })
    }

    res.status(500).json({
      error: 'Error al crear producto',
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto inválido',
      })
    }

    const {
      nombre,
      codigo,
      precioVenta,
      costoProveedor,
      stockActual,
      stockMinimo,
      activo,
      categoriaId,
      proveedorId,
      manejaPack,
      unidadesPorPack,
    } = req.body

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
        nombre: nombre !== undefined ? String(nombre).trim() : undefined,
        codigo: codigo !== undefined ? String(codigo).trim() : undefined,
        precioVenta: precioVenta !== undefined ? Number(precioVenta) : undefined,
        costoProveedor:
          costoProveedor !== undefined ? Number(costoProveedor) : undefined,
        stockActual: stockActual !== undefined ? Number(stockActual) : undefined,
        stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : undefined,
        activo: activo !== undefined ? Boolean(activo) : undefined,
        categoriaId: categoriaId !== undefined ? Number(categoriaId) : undefined,
        proveedorId: proveedorId !== undefined ? Number(proveedorId) : undefined,

        // ✅ ESTA ES LA CLAVE
        manejaPack: manejaPack !== undefined ? Boolean(manejaPack) : undefined,
        unidadesPorPack:
          manejaPack
            ? Number(unidadesPorPack)
            : null,
      },
      include: {
        categoria: true,
        proveedor: true,
      },
    })

    res.json(productoActualizado)
  } catch (error: any) {
    console.error(error)

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe un producto con ese código',
      })
    }

    res.status(500).json({
      error: 'Error al actualizar producto',
    })
  }
})

router.patch('/:id/estado', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto inválido',
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

export default router