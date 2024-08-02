import { formidable, Fields, Files } from 'formidable'
import { readFiles } from 'h3-formidable'
import { storage } from '@/server/lib/storage'
import { prisma } from '@/server/lib/db'
import { v7 } from 'uuid'
import { findFlaffByMergeId, getFlaffIdFromParam } from '~/server/utils/flaff'
import { z } from 'zod'

const ParamsSchema = z.object({
  name: z.string(),
  fileId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const data = await readMultipartFormData(event)

  const flaffId = await getFlaffIdFromParam(event)
  const flaff = await findFlaffByMergeId(flaffId)
  const query = await getQuery(event)
  console.log('query folder', query)

  // handle folder name
  const { name, fileId } = await readValidatedBody(event, ParamsSchema.parse)
  if (!name) throw createError({
    statusCode: 400,
    statusMessage: 'name not found',
  })
  if (fileId) {
    const parent = await prisma.file.findUnique({
      where: {
        uuid: fileId
      }
    })
    if (!parent) throw createError({
      statusCode: 400,
      statusMessage: 'parent folder not found',
    })
  }

  // save
  const created = await prisma.$transaction(async (tx) => {
    const uuid = v7()
    return await tx.file.create({
      data: {
        extension: 'directory',
        mimeType: 'application/x-directory',
        name,
        type: 'folder',
        uuid,
        flaff: {
          connect: {
            uuid: flaff.uuid
          }
        },
        size: 0,
        
        ...(fileId ? {
          parent: {
            connect: {
              uuid: fileId
            }
          }
        }: {})
      }
    })
  })

  return {
    ok: true,
    message: 'success create folder',
    data: created
  }
})