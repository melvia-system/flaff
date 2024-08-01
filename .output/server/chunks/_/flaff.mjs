import { p as prisma, c as createError, g as getValidatedRouterParams } from '../runtime.mjs';
import { z } from 'zod';

const findFlaffByMergeId = async (flaffId, withFiles = false) => {
  let flaff = await prisma.flaff.findFirst({
    where: {
      // where guestLink is equal to flaffId or ownerLink is equal to flaffId
      OR: [
        {
          uuid: flaffId
        },
        {
          guestLink: flaffId
        },
        {
          ownerLink: flaffId
        }
      ]
    },
    include: {
      files: true
    }
  });
  if (!flaff) {
    throw createError({
      statusCode: 404,
      statusMessage: "flaff not found"
    });
  }
  return flaff;
};
const getFlaffIdFromParam = async (event) => {
  const ParamsSchema = z.object({
    flaffId: z.string()
  });
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse);
  return flaffId;
};

export { findFlaffByMergeId as f, getFlaffIdFromParam as g };
//# sourceMappingURL=flaff.mjs.map
