import { z } from 'zod'
import { prisma } from "@/server/lib/db"

const schema = z.object({
  title: z.string(),
  guestPassword: z.string().optional(),
  ownerPassword: z.string().optional(),
})

const ParamsSchema = z.object({
  flaffId: z.string(),
})

export default defineEventHandler(async (event) => {
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse)
  const { title, guestPassword, ownerPassword } = await readValidatedBody(event, schema.parse)

  const flaff = await findFlaffByMergeId(flaffId, true)

  await prisma.flaff.update({
    where: {
      uuid: flaff.uuid,
    },
    data: {
      title,
      guestPassword,
      ownerPassword,
    },
  })

  return {
    ok: true,
    message: 'Flaff updated',
  }
})