import { Router } from 'express'
import { Rol, TipoMovimientoCaja } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'
import {
  calcularTotalesMovimientos,
  calcularTotalesPorMetodo,
  buildCajaDetalle,
  getCajaAbierta,
  getVentasDelDia,
  mapCajaEstado,
  toMoneyInt,
} from './caja.service'

const router = Router()
const adminOrCajero = roleMiddleware([Rol.ADMIN, Rol.CAJERO])

router.use(authMiddleware, adminOrCajero)

router.get('/estado', async (_req, res) => {
  try {
    const caja = await getCajaAbierta()
    const ventas = await getVentasDelDia()
    const metodosPago = calcularTotalesPorMetodo(ventas)
    const movimientos = caja ? calcularTotalesMovimientos(caja.movimientos) : { ingresos: 0, egresos: 0, retiros: 0 }
    const totalEsperado = caja
      ? caja.montoInicial +
        metodosPago.efectivo +
        movimientos.ingresos -
        movimientos.egresos -
        movimientos.retiros
      : null

    res.json({
      caja: mapCajaEstado(caja),
      resumen: {
        ventasEfectivo: metodosPago.efectivo,
        ventasQR: metodosPago.qr,
        ventasTransferencia: metodosPago.transferencia,
        ventasMixto: metodosPago.mixto,
        ingresosCaja: movimientos.ingresos,
        egresosCaja: movimientos.egresos,
        retirosCaja: movimientos.retiros,
        totalEsperado,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener estado de caja' })
  }
})

router.post('/abrir', async (req, res) => {
  try {
    const montoInicial = toMoneyInt(req.body.montoInicial)
    const observacion = String(req.body.observacion || '').trim()

    if (montoInicial < 0) {
      return res.status(400).json({ error: 'El monto inicial no puede ser negativo' })
    }

    const cajaAbierta = await getCajaAbierta()

    if (cajaAbierta) {
      return res.status(409).json({ error: 'Ya existe una caja abierta' })
    }

    const caja = await prisma.cajaDiaria.create({
      data: {
        montoInicial,
        observacionApertura: observacion || null,
        abiertaPorId: req.user!.id,
      },
      include: {
        abiertaPor: {
          select: {
            id: true,
            nombre: true,
            username: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Caja abierta correctamente',
      caja,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al abrir caja' })
  }
})

router.post('/cerrar', async (req, res) => {
  try {
    const montoFinal = toMoneyInt(req.body.montoFinal)
    const observacion = String(req.body.observacion || '').trim()

    if (montoFinal < 0) {
      return res.status(400).json({ error: 'El monto final no puede ser negativo' })
    }

    const caja = await getCajaAbierta()

    if (!caja) {
      return res.status(404).json({ error: 'No hay caja abierta para cerrar' })
    }

    const ventas = await getVentasDelDia()
    const metodosPago = calcularTotalesPorMetodo(ventas)
    const movimientos = calcularTotalesMovimientos(caja.movimientos)
    const totalEsperado =
      caja.montoInicial +
      metodosPago.efectivo +
      movimientos.ingresos -
      movimientos.egresos -
      movimientos.retiros
    const diferencia = montoFinal - totalEsperado

    const cajaCerrada = await prisma.cajaDiaria.update({
      where: { id: caja.id },
      data: {
        estado: 'CERRADA',
        montoFinal,
        totalEfectivo: metodosPago.efectivo,
        totalQR: metodosPago.qr,
        totalTransferencia: metodosPago.transferencia,
        totalMixto: metodosPago.mixto,
        totalEsperado,
        diferencia,
        observacionCierre: observacion || null,
        cerradaPorId: req.user!.id,
        cerradaEn: new Date(),
      },
    })

    res.json({
      message: 'Caja cerrada correctamente',
      caja: cajaCerrada,
      resumen: {
        montoInicial: caja.montoInicial,
        montoFinal,
        ventasEfectivo: metodosPago.efectivo,
        ventasQR: metodosPago.qr,
        ventasTransferencia: metodosPago.transferencia,
        ventasMixto: metodosPago.mixto,
        ingresosCaja: movimientos.ingresos,
        egresosCaja: movimientos.egresos,
        retirosCaja: movimientos.retiros,
        totalEsperado,
        diferencia,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cerrar caja' })
  }
})

router.get('/historial', async (req, res) => {
  try {
    const where =
      req.user!.rol === Rol.ADMIN
        ? {}
        : {
            abiertaPorId: req.user!.id,
          }

    const cajas = await prisma.cajaDiaria.findMany({
      where,
      orderBy: {
        fecha: 'desc',
      },
      take: 60,
      include: {
        abiertaPor: {
          select: {
            nombre: true,
            username: true,
          },
        },
        cerradaPor: {
          select: {
            nombre: true,
            username: true,
          },
        },
      },
    })

    res.json(cajas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener historial de caja' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const detalle = await buildCajaDetalle(req.params.id)

    if (!detalle) {
      return res.status(404).json({ error: 'Caja no encontrada' })
    }

    if (req.user!.rol !== Rol.ADMIN && detalle.caja.abiertaPorId !== req.user!.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta caja' })
    }

    res.json(detalle)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener detalle de caja' })
  }
})

router.post('/movimientos', async (req, res) => {
  try {
    const tipo = String(req.body.tipo || '') as TipoMovimientoCaja
    const monto = toMoneyInt(req.body.monto)
    const concepto = String(req.body.concepto || '').trim()
    const observacion = String(req.body.observacion || '').trim()

    if (!['INGRESO', 'EGRESO', 'RETIRO'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de movimiento invalido' })
    }

    if (monto <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero' })
    }

    if (!concepto) {
      return res.status(400).json({ error: 'El concepto es obligatorio' })
    }

    const caja = await getCajaAbierta()

    if (!caja) {
      return res.status(404).json({ error: 'No hay caja abierta' })
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        tipo,
        monto,
        concepto,
        observacion: observacion || null,
        creadoPorId: req.user!.id,
      },
    })

    res.status(201).json({
      message: 'Movimiento registrado correctamente',
      movimiento,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar movimiento de caja' })
  }
})

export default router
