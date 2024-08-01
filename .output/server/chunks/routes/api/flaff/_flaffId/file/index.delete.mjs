import { d as defineEventHandler, g as getValidatedRouterParams, p as prisma } from '../../../../../runtime.mjs';
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
const index_delete = defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event);
  await findFlaffByMergeId(flaffId);
  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse);
  await prisma.$transaction(async (tx) => {
    try {
      await storage.removeItem(fileId);
    } catch (error) {
      console.error(error);
    }
    return await tx.file.delete({
      where: {
        uuid: fileId
      }
    });
  });
  return {
    ok: true,
    message: "success delete file"
  };
});

export { ParamsSchema, index_delete as default };
//# sourceMappingURL=index.delete.mjs.map
