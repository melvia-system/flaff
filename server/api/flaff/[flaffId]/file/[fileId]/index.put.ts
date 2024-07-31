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
  const data = await readMultipartFormData(event)

  const flaffId = await getFlaffIdFromParam(event)
  const flaff = await findFlaffByMergeId(flaffId)
  
  // handle file
  const file = data?.find(item => item.name === 'file')
  if (!file) throw createError({
    statusCode: 400,
    statusMessage: 'file not found',
  })
  if (!file.filename) throw createError({
    statusCode: 400,
    statusMessage: 'file name not found',
  })
  if (!file.type) throw createError({
    statusCode: 400,
    statusMessage: 'file type not found',
  })


  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse)
  const fileSaved = flaff.files.find(f => f.uuid === fileId)
  if (!fileSaved) throw createError({
    statusCode: 404,
    statusMessage: 'File not found',
  })

  // const data = await storage.getItemRaw(file.uuid)

  // storage
  try {
    const created = await prisma.$transaction(async (tx) => {
      const mimeType = file.type || 'text/plain'
      const ext = getExtFromFileName(file.filename || '') || mimeType.split('/').pop() || 'txt'
      // calculate data size in bytes form buffer
      const size = file.data.length

      await storage.setItemRaw(fileSaved.uuid, file.data)

      // this for upload new file
      // await storage.setItemRaw(uuid, file.data)
      // return await tx.file.create({
      //   data: {
      //     extension: ext,
      //     mimeType,
      //     name: file.filename as string,
      //     type: 'file',
      //     uuid,
      //     size,
      //     flaff: {
      //       connect: {
      //         uuid: flaff.uuid
      //       }
      //     }
      //   }
      // })

      return await tx.file.update({
        where: {
          uuid: fileSaved.uuid,
        },
        data: {
          extension: ext,
          mimeType,
          name: file.filename as string,
          size,
        }
      })
    })
    return {
      ok: true,
      message: 'file uploaded',
      data: {
        file: created,
      }
    }
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'failed to upload file',
    })
  }
})