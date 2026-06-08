import { Rol } from '@prisma/client'
import { prisma } from '../config/prisma'
import { hashPassword } from '../utils/password'

async function main() {
  const username = process.env.ADMIN_DEFAULT_USERNAME || 'Osvaldo'
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Cohete018'
  const passwordHash = await hashPassword(password)

  const targetAdmin = await prisma.usuario.findUnique({
    where: { username },
  })

  if (targetAdmin) {
    await prisma.usuario.update({
      where: { id: targetAdmin.id },
      data: {
        nombre: 'Osvaldo',
        username,
        rol: Rol.ADMIN,
        activo: true,
        debeCambiarPassword: false,
      },
    })
    console.log(`Admin principal verificado: ${username}`)
    return
  }

  const legacyAdmin = await prisma.usuario.findUnique({
    where: { username: 'admin' },
  })

  if (legacyAdmin) {
    await prisma.usuario.update({
      where: { id: legacyAdmin.id },
      data: {
        nombre: 'Osvaldo',
        username,
        password: passwordHash,
        rol: Rol.ADMIN,
        activo: true,
        debeCambiarPassword: false,
      },
    })
    console.log(`Admin viejo actualizado a: ${username}`)
    return
  }

  await prisma.usuario.create({
    data: {
      nombre: 'Osvaldo',
      username,
      password: passwordHash,
      rol: Rol.ADMIN,
      activo: true,
      debeCambiarPassword: false,
    },
  })

  console.log(`Admin principal creado: ${username}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
