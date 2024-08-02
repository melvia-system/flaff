import { d as defineEventHandler, g as getValidatedRouterParams, b as getQuery, c as createError } from '../../../runtime.mjs';
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
  if (flaff.ownerPassword && flaffId === flaff.ownerLink && flaff.ownerPassword !== query.password)
    throw createError({
      message: "Password is incorrect",
      status: 401
    });
  let isOwner = false;
  if (flaff.ownerLink === flaffId)
    isOwner = true;
  function restructureData(files) {
    const fileMap = new Map(files.map((file) => [file.uuid, { ...file, files: [] }]));
    const rootFolders = [];
    files.forEach((file) => {
      if (file.fileId) {
        const parent = fileMap.get(file.fileId);
        if (parent) {
          const a = fileMap.get(file.uuid);
          if (parent.files && a) {
            parent.files.push(a);
          }
        }
      } else {
        rootFolders.push(fileMap.get(file.uuid));
      }
    });
    return rootFolders;
  }
  const data = isOwner ? {
    ...flaff,
    files: restructureData(flaff.files)
  } : {
    title: flaff.title,
    uuid: flaff.uuid,
    createdAt: flaff.createdAt,
    updatedAt: flaff.updatedAt,
    files: restructureData(flaff.files)
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
