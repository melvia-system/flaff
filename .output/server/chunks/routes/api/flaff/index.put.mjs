import { d as defineEventHandler, g as getValidatedRouterParams, e as readValidatedBody, p as prisma } from '../../../runtime.mjs';
import { f as findFlaffByMergeId } from '../../../_/flaff.mjs';
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

const schema = z.object({
  title: z.string(),
  guestPassword: z.string().optional()
});
const ParamsSchema = z.object({
  flaffId: z.string()
});
const index_put = defineEventHandler(async (event) => {
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse);
  const { title, guestPassword } = await readValidatedBody(event, schema.parse);
  const flaff = await findFlaffByMergeId(flaffId, true);
  await prisma.flaff.update({
    where: {
      uuid: flaff.uuid
    },
    data: {
      title,
      guestPassword
    }
  });
  return {
    ok: true,
    message: "Flaff updated"
  };
});

export { index_put as default };
//# sourceMappingURL=index.put.mjs.map
