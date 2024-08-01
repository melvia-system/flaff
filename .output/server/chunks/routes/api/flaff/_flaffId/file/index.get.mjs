import { d as defineEventHandler, g as getValidatedRouterParams, c as createError } from '../../../../../runtime.mjs';
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

const ParamsSchema = z.object({
  fileId: z.string()
});
const index_get = defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event);
  const flaff = await findFlaffByMergeId(flaffId);
  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse);
  const file = flaff.files.find((f) => f.uuid === fileId);
  if (!file)
    throw createError({
      statusCode: 404,
      statusMessage: "File not found"
    });
  const data = await storage.getItemRaw(file.uuid);
  event.node.res.setHeader("Content-Type", file.mimeType);
  return data;
});

export { ParamsSchema, index_get as default };
//# sourceMappingURL=index.get.mjs.map
