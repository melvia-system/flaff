import { d as defineEventHandler, r as readMultipartFormData, c as createError, g as getValidatedRouterParams, p as prisma } from '../../../../../runtime.mjs';
import { s as storage } from '../../../../../_/storage.mjs';
import { g as getFlaffIdFromParam, f as findFlaffByMergeId } from '../../../../../_/flaff.mjs';
import { z } from 'zod';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import '@prisma/client';
import 'node:fs';
import 'node:url';
import '@iconify/utils';
import 'consola/core';

const getExtFromFileName = (filename) => {
  const ext = filename.split(".").pop();
  return ext;
};
const ParamsSchema = z.object({
  fileId: z.string()
});
const index_put = defineEventHandler(async (event) => {
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
  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse);
  const fileSaved = flaff.files.find((f) => f.uuid === fileId);
  if (!fileSaved)
    throw createError({
      statusCode: 404,
      statusMessage: "File not found"
    });
  try {
    const created = await prisma.$transaction(async (tx) => {
      const mimeType = file.type || "text/plain";
      const ext = getExtFromFileName(file.filename || "") || mimeType.split("/").pop() || "txt";
      const size = file.data.length;
      await storage.setItemRaw(fileSaved.uuid, file.data);
      return await tx.file.update({
        where: {
          uuid: fileSaved.uuid
        },
        data: {
          extension: ext,
          mimeType,
          name: file.filename,
          size
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

export { ParamsSchema, index_put as default };
//# sourceMappingURL=index.put.mjs.map
