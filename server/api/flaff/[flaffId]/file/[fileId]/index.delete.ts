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
    // delete file children
    const uuids = (await tx.file.findMany({
      where: {
        fileId,
      },
    })).map(item => item.uuid)
    console.log('uuids', uuids)
    await tx.file.deleteMany({
      where: {
        fileId,
      },
    })

    await tx.file.delete({
      where: {
        uuid: fileId,
      },
    })

    try {
      await storage.removeItem(fileId)
      for (const uuid of uuids) {
        await storage.removeItem(uuid)
      }
    } catch (error) {
      console.error(error)
      throw new Error('failed to delete file')
    }
  })

  return {
    ok: true,
    message: 'success delete file',
  }
})