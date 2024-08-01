import { d as defineEventHandler, g as getValidatedRouterParams, e as getQuery, c as createError } from '../../../runtime.mjs';
import { z } from 'zod';
import { f as findFlaffByMergeId } from '../../../_/flaff.mjs';
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
  flaffId: z.string()
});
z.object({
  password: z.string().optional()
});
const index_get = defineEventHandler(async (event) => {
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse);
  const query = getQuery(event);
  const flaff = await findFlaffByMergeId(flaffId, true);
  if (flaff.guestPassword && flaff.guestPassword !== query.password && flaffId !== flaff.ownerLink)
    throw createError({
      message: "Password is incorrect",
      status: 401
    });
  let isOwner = false;
  if (flaff.ownerLink === flaffId)
    isOwner = true;
  const data = isOwner ? flaff : {
    title: flaff.title,
    uuid: flaff.uuid,
    createdAt: flaff.createdAt,
    updatedAt: flaff.updatedAt,
    files: flaff.files || []
  };
  return {
    ok: true,
    message: "flaff found",
    data: {
      ...data,
      isOwner
    }
  };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
