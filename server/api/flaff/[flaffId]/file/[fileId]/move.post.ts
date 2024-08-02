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

export const BodySchema = z.object({
  fileId: z.string(),
  targetId: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event)
  const flaff = await findFlaffByMergeId(flaffId)

  const { fileId, targetId } = await readValidatedBody(event, BodySchema.parse)

  // find file in flaff
  const file = flaff.files.find(file => file.uuid === fileId)
  if (!file) {
    throw createError({
      statusCode: 404,
      statusMessage: 'file not found',
    })
  }
  if (targetId) {
    const target = flaff.files.find(file => file.uuid === targetId)
    // target id muse exist
    if (!target) {
      throw createError({
        statusCode: 404,
        statusMessage: 'target not found',
      })
    }
    // target must folder
    if (target.type !== 'folder') {
      throw createError({
        statusCode: 400,
        statusMessage: 'target is not a folder',
      })
    }
    // target not same with file
    if (target.uuid === fileId || target.uuid === file.uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'target is same with file',
      })
    }

    await prisma.file.update({
      where: {
        uuid: fileId,
      },
      data: {
        parent: {
          connect: {
            uuid: targetId,
          }
        }
      }
    })
  } else {
    await prisma.file.update({
      where: {
        uuid: fileId,
      },
      data: {
        parent: {
          disconnect: true,
        }
      }
    })
  }

  return {
    ok: true,
    data: {
      fileId,
      targetId,
    }
  }
})