import { formidable, Fields, Files } from 'formidable'
import { readFiles } from 'h3-formidable'
import { storage } from '@/server/lib/storage'
import { prisma } from '@/server/lib/db'
import { v7 } from 'uuid'
import { findFlaffByMergeId, getFlaffIdFromParam } from '~/server/utils/flaff'

const getExtFromFileName = (filename: string) => {
  const ext = filename.split('.').pop()
  return ext
}

export default defineEventHandler(async (event) => {
  const data = await readMultipartFormData(event)
  let targetId = data?.find(item => item.name === 'targetId')?.data.toString()
  if (targetId) {
    console.log('targetId', targetId)
  }

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

  // storage
  try {
    const created = await prisma.$transaction(async (tx) => {
      const mimeType = file.type || 'text/plain'
      const ext = getExtFromFileName(file.filename || '') || mimeType.split('/').pop() || 'txt'
      const uuid = v7()

      // check if file already exists
      const query = await tx.file.findFirst({
        where: {
          name: file.filename as string,
          flaffUuid: flaff.uuid,
        }
      })
      if (query) {
        // remove file from storage
        await storage.removeItem(uuid)
        // remove file from database
        await tx.file.delete({
          where: {
            uuid: query.uuid
          }
        })
      }

      // save
      // calculate data size in bytes form buffer
      const size = file.data.length
      await storage.setItemRaw(uuid, file.data)
      
      return await tx.file.create({
        data: {
          extension: ext,
          mimeType,
          name: file.filename as string,
          type: 'file',
          uuid,
          size,
          flaff: {
            connect: {
              uuid: flaff.uuid
            }
          },
          ...(targetId ? {
            parent: {
              connect: {
                uuid: targetId
              }
            }
          } : {}),
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