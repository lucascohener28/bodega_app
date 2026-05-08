import { Rol } from '@prisma/client'
import { prisma } from '../config/prisma'
import { hashPassword } from '../utils/password'

async function main() {
  const username = process.env.ADMIN_DEFAULT_USERNAME || 'admin'
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123'

  const existing = await prisma.usuario.findUnique({
    where: { username },
  })

  if (existing) {
    console.log(`Admin default ya existe: ${username}`)
    return
  }

  await prisma.usuario.create({
    data: {
      nombre: 'Administrador',
      username,
      password: await hashPassword(password),
      rol: Rol.ADMIN,
      activo: true,
    },
  })

  console.log(`Admin default creado: ${username}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
