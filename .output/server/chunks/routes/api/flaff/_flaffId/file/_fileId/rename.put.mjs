import { d as defineEventHandler, g as getValidatedRouterParams, a as readValidatedBody, p as prisma } from '../../../../../../runtime.mjs';
import { g as getFlaffIdFromParam, f as findFlaffByMergeId } from '../../../../../../_/flaff.mjs';
import { z } from 'zod';
import mime from 'mime';
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
const BodySchema = z.object({
  name: z.string()
});
const rename_put = defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event);
  await findFlaffByMergeId(flaffId);
  const { fileId } = await getValidatedRouterParams(event, ParamsSchema.parse);
  const { name } = await readValidatedBody(event, BodySchema.parse);
  const ext = name.split(".").pop() || ".txt";
  const mimeType = mime.getType(ext) || "text/plain";
  await prisma.file.update({
    where: {
      uuid: fileId
    },
    data: {
      name,
      extension: ext,
      mimeType
    }
  });
  return {
    ok: true,
    message: "success"
  };
});

export { BodySchema, ParamsSchema, rename_put as default };
//# sourceMappingURL=rename.put.mjs.map
