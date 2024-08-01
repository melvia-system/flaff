import { d as defineEventHandler, r as readMultipartFormData, c as createError, p as prisma } from '../../../../runtime.mjs';
import { s as storage } from '../../../../_/storage.mjs';
import { g as getFlaffIdFromParam, f as findFlaffByMergeId } from '../../../../_/flaff.mjs';
import { v as v7 } from '../../../../_/v7.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import '@prisma/client';
import 'node:fs';
import 'node:url';
import '@iconify/utils';
import 'consola/core';
import 'zod';
import 'node:crypto';

const getExtFromFileName = (filename) => {
  const ext = filename.split(".").pop();
  return ext;
};
const index_post = defineEventHandler(async (event) => {
  const data = await readMultipartFormData(event);
  const flaffId = await getFlaffIdFromParam(event);
  const flaff = await findFlaffByMergeId(flaffId);
  const file = data == null ? void 0 : data.find((item) => item.name === "file");
  if (!file)
    throw createError({
      statusCode: 400,
      statusMessage: "file not found"
    });
  if (!file.filename)
    throw createError({
      statusCode: 400,
      statusMessage: "file name not found"
    });
  if (!file.type)
    throw createError({
      statusCode: 400,
      statusMessage: "file type not found"
    });
  try {
    const created = await prisma.$transaction(async (tx) => {
      const mimeType = file.type || "text/plain";
      const ext = getExtFromFileName(file.filename || "") || mimeType.split("/").pop() || "txt";
      const uuid = v7();
      const size = file.data.length;
      await storage.setItemRaw(uuid, file.data);
      return await tx.file.create({
        data: {
          extension: ext,
          mimeType,
          name: file.filename,
          type: "file",
          uuid,
          size,
          flaff: {
            connect: {
              uuid: flaff.uuid
            }
          }
        }
      });
    });
    return {
      ok: true,
      message: "file uploaded",
      data: {
        file: created
      }
    };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: "failed to upload file"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
