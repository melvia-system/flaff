import { z } from "zod"
import { prisma } from "@/server/lib/db"
import { findFlaffByMergeId, FlaffWithFiles } from "~/server/utils/flaff";

const ParamsSchema = z.object({
  flaffId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse)

 const flaff = await findFlaffByMergeId(flaffId, true)

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