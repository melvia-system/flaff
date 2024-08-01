import { z } from "zod"
import { findFlaffByMergeId, FlaffWithFiles } from "~/server/utils/flaff";

const ParamsSchema = z.object({
  flaffId: z.string(),
})

const QuerySchema = z.object({
  password: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse)
  const query = getQuery(event)

 const flaff = await findFlaffByMergeId(flaffId, true)

  // check password
  if (
    (flaff.guestPassword)
    && (flaff.guestPassword !== query.password)
    && (flaffId !== flaff.ownerLink)
  ) throw createError({
    message: 'Password is incorrect',
    status: 401,
  })
  if (flaff.ownerPassword && flaffId === flaff.ownerLink && flaff.ownerPassword !== query.password) throw createError({
    message: 'Password is incorrect',
    status: 401,
  })


  // check owner or not
  let isOwner = false
  if (flaff.ownerLink === flaffId) isOwner = true

  // 
  const data = (isOwner) ? flaff : {
    title: flaff.title,
    uuid: flaff.uuid,
    createdAt: flaff.createdAt,
    updatedAt: flaff.updatedAt,
    files: flaff.files || [],
  }

  return {
    ok: true,
    message: 'flaff found',
    data: {
      ...data,
      isOwner,
    } as (FlaffWithFiles & { isOwner: boolean }),
  }
})