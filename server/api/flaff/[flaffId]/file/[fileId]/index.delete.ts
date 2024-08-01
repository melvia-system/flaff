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

export default defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event)
  const flaff = await findFlaffByMergeId(flaffId)
  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse)

  const deleted = await prisma.$transaction(async (tx) => {
    try {
      await storage.removeItem(fileId)
    } catch (error) {
      console.error(error)
    }
    return await tx.file.delete({
      where: {
        uuid: fileId,
      },
    })
  })

  return {
    ok: true,
    message: 'success delete file',
  }
})