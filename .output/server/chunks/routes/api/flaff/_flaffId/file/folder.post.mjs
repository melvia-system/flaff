import { d as defineEventHandler, r as readMultipartFormData, b as getQuery, a as readValidatedBody, c as createError, p as prisma } from '../../../../../runtime.mjs';
import { g as getFlaffIdFromParam, f as findFlaffByMergeId } from '../../../../../_/flaff.mjs';
import { z } from 'zod';
import { v as v7 } from '../../../../../_/v7.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import '@prisma/client';
import 'node:fs';
import 'node:url';
import '@iconify/utils';
import 'consola/core';
import 'node:crypto';

const ParamsSchema = z.object({
  name: z.string(),
  fileId: z.string().optional()
});
const folder_post = defineEventHandler(async (event) => {
  await readMultipartFormData(event);
  const flaffId = await getFlaffIdFromParam(event);
  const flaff = await findFlaffByMergeId(flaffId);
  const query = await getQuery(event);
  console.log("query folder", query);
  const { name, fileId } = await readValidatedBody(event, ParamsSchema.parse);
  if (!name)
    throw createError({
      statusCode: 400,
      statusMessage: "name not found"
    });
  if (fileId) {
    const parent = await prisma.file.findUnique({
      where: {
        uuid: fileId
      }
    });
    if (!parent)
      throw createError({
        statusCode: 400,
        statusMessage: "parent folder not found"
      });
  }
  const created = await prisma.$transaction(async (tx) => {
    const uuid = v7();
    return await tx.file.create({
      data: {
        extension: "directory",
        mimeType: "application/x-directory",
        name,
        type: "folder",
        uuid,
        flaff: {
          connect: {
            uuid: flaff.uuid
          }
        },
        size: 0,
        ...fileId ? {
          parent: {
            connect: {
              uuid: fileId
            }
          }
        } : {}
      }
    });
  });
  return {
    ok: true,
    message: "success create folder",
    data: created
  };
});

export { folder_post as default };
//# sourceMappingURL=folder.post.mjs.map
