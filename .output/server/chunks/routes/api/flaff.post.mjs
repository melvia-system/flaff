import { d as defineEventHandler, p as prisma } from '../../runtime.mjs';
import { faker } from '@faker-js/faker';
import crypto from 'node:crypto';
import { r as rng, u as unsafeStringify, v as v7 } from '../../_/v7.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import '@prisma/client';
import 'node:fs';
import 'node:url';
import '@iconify/utils';
import 'consola/core';

const native = {
  randomUUID: crypto.randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80;
  return unsafeStringify(rnds);
}

const flaff_post = defineEventHandler(async () => {
  try {
    const generateUniqueToken = (length = 32) => {
      const hex = v4();
      const uuid = v7();
      return {
        uuid,
        hex,
        result: `${uuid}-${hex}`
      };
    };
    const token = generateUniqueToken();
    const capitalize = (s) => {
      return s.replace(/\b\w/g, (l) => l.toUpperCase());
    };
    const created = await prisma.flaff.create({
      data: {
        uuid: token.uuid,
        ownerLink: token.result,
        guestLink: token.uuid,
        title: capitalize(faker.animal.cat() + ` Flaffy ` + faker.color.human())
      }
    });
    return {
      ok: true,
      message: "flaff created",
      data: {
        ...created
      }
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "failed to create flaff",
      data: null
    };
  }
});

export { flaff_post as default };
//# sourceMappingURL=flaff.post.mjs.map
