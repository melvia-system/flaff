import { z } from "zod"
import { Prisma, prisma } from "../lib/db"
import { H3Event, EventHandlerRequest } from 'h3'

export type FlaffWithFiles = Prisma.FlaffGetPayload<{ include: { files: true } }>

export const findFlaffByMergeId = async (flaffId: string, withFiles = false): Promise<FlaffWithFiles> => {
  // find by guestLink first
  let flaff = await prisma.flaff.findFirst({
    where: {
      // where guestLink is equal to flaffId or ownerLink is equal to flaffId
      OR: [
        {
          uuid: flaffId,
        },
        {
          guestLink: flaffId,
        },
        {
          ownerLink: flaffId,
        },
      ],
    },
    include: {
      files: true,
    }
  })
  if (!flaff) {
    throw createError({
      statusCode: 404,
      statusMessage: 'flaff not found',
    })
  }

  return flaff as FlaffWithFiles
}

export const getFlaffIdFromParam = async (event: H3Event<EventHandlerRequest>) => {
  const ParamsSchema = z.object({
    flaffId: z.string(),
  });
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse)
  return flaffId
}