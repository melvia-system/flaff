import { formidable, Fields, Files } from 'formidable'
import { readFiles } from 'h3-formidable'
import { storage } from '@/server/lib/storage'
import { prisma } from '@/server/lib/db'
import { v7 } from 'uuid'
import { findFlaffByMergeId, getFlaffIdFromParam } from '~/server/utils/flaff'
import { z } from 'zod'

const getExtFromFileName = (filename: string) => {
  const ext = filename.split('.').pop()
  return ext
}

export const ParamsSchema = z.object({
  fileId: z.string(),
});

export default defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event)
  const flaff = await findFlaffByMergeId(flaffId)
  
  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse)
  const file = flaff.files.find(f => f.uuid === fileId)
  if (!file) throw createError({
    statusCode: 404,
    statusMessage: 'File not found',
  })

  const data = await storage.getItemRaw(file.uuid)
  event.node.res.setHeader('Content-Type', file.mimeType)

  return data
})