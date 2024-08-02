import { d as defineEventHandler, a as readValidatedBody, c as createError, p as prisma } from '../../../../../../runtime.mjs';
import { g as getFlaffIdFromParam, f as findFlaffByMergeId } from '../../../../../../_/flaff.mjs';
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
const BodySchema = z.object({
  fileId: z.string(),
  targetId: z.string().optional()
});
const move_post = defineEventHandler(async (event) => {
  const flaffId = await getFlaffIdFromParam(event);
  const flaff = await findFlaffByMergeId(flaffId);
  const { fileId, targetId } = await readValidatedBody(event, BodySchema.parse);
  const file = flaff.files.find((file2) => file2.uuid === fileId);
  if (!file) {
    throw createError({
      statusCode: 404,
      statusMessage: "file not found"
    });
  }
  if (targetId) {
    const target = flaff.files.find((file2) => file2.uuid === targetId);
    if (!target) {
      throw createError({
        statusCode: 404,
        statusMessage: "target not found"
      });
    }
    if (target.type !== "folder") {
      throw createError({
        statusCode: 400,
        statusMessage: "target is not a folder"
      });
    }
    await prisma.file.update({
      where: {
        uuid: fileId
      },
      data: {
        parent: {
          connect: {
            uuid: targetId
          }
        }
      }
    });
  } else {
    await prisma.file.update({
      where: {
        uuid: fileId
      },
      data: {
        parent: {
          disconnect: true
        }
      }
    });
  }
  return {
    ok: true,
    data: {
      fileId,
      targetId
    }
  };
});

export { BodySchema, ParamsSchema, move_post as default };
//# sourceMappingURL=move.post.mjs.map
