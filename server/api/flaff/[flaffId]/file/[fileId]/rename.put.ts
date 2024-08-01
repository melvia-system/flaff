import { formidable, Fields, Files } from 'formidable'
import { readFiles } from 'h3-formidable'
import { storage } from '@/server/lib/storage'
import { prisma } from '@/server/lib/db'
import { v7 } from 'uuid'
import { findFlaffByMergeId, getFlaffIdFromParam } from '~/server/utils/flaff'
import { z } from 'zod'
import mime from 'mime'

export const ParamsSchema = z.object({
  fileId: z.string(),
})
export const BodySchema = z.object({
  name: z.string(),
})

export default defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event)
  const flaff = await findFlaffByMergeId(flaffId)
  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse)
  
  const { name }  = await readValidatedBody(event, BodySchema.parse)

  const ext = name.split('.').pop() || '.txt'
  const mimeType = mime.getType(ext) || 'text/plain'

  const updated = await prisma.file.update({
    where: {
      uuid: fileId,
    },
    data: {
      name,
      extension: ext,
      mimeType,
    },
  })

  return {
    ok: true,
    message: 'success',
  }
})