import { z } from "zod"
import { findFlaffByMergeId, FlaffWithFiles } from "~/server/utils/flaff";

const ParamsSchema = z.object({
  flaffId: z.string(),
})

const QuerySchema = z.object({
  password: z.string().optional(),
})

type FlaffWithFilesWithNestedFiles = FlaffWithFiles['files'] & {
  files: FlaffWithFilesWithNestedFiles[];
}

type Result = FlaffWithFiles & {
  files: FlaffWithFilesWithNestedFiles[];
  isOwner: boolean;
}

export default defineEventHandler(async (event) => {
  const { flaffId } = await getValidatedRouterParams(event, ParamsSchema.parse)
  const query = getQuery(event)

 const flaff = await findFlaffByMergeId(flaffId, true)

  // check password
  if (
    (flaff.guestPassword)
    && (flaff.guestPassword !== query.password)
    && (flaffId !== flaff.ownerLink)
  ) throw createError({
    message: 'Password is incorrect',
    status: 401,
  })
  if (flaff.ownerPassword && flaffId === flaff.ownerLink && flaff.ownerPassword !== query.password) throw createError({
    message: 'Password is incorrect',
    status: 401,
  })


  // check owner or not
  let isOwner = false
  if (flaff.ownerLink === flaffId) isOwner = true

  // restructure files obj
  function restructureData(files: FlaffWithFiles['files']) {
    // Buat peta untuk memetakan UUID ke objek file
    // const fileMap = new Map(files.map(file => [file.uuid, { ...file, files: [] }]))
    const fileMap = new Map(files.map(file => [file.uuid, { ...file, files: [] as FlaffWithFilesWithNestedFiles[] }]));
    
    // Variabel untuk menyimpan root folders
    const rootFolders: FlaffWithFilesWithNestedFiles[] = [];

    // Isi peta dengan referensi parent-child
    files.forEach(file => {
      if (file.fileId) {
        const parent = fileMap.get(file.fileId) as unknown as FlaffWithFilesWithNestedFiles;
        if (parent) {
          // parent.files.push(fileMap.get(file.uuid));
          const a = fileMap.get(file.uuid) as unknown as FlaffWithFilesWithNestedFiles;
          if (parent.files && a) {
            parent.files.push(a);
          }
        }
      } else {
        // Jika file tidak memiliki parent, maka itu adalah root folder
        rootFolders.push(fileMap.get(file.uuid) as unknown as FlaffWithFilesWithNestedFiles);
      }
    });

    return rootFolders;
  }

  // 
  const data = (isOwner) ? {
    ...flaff,
    files: restructureData(flaff.files),
  } : {
    title: flaff.title,
    uuid: flaff.uuid,
    createdAt: flaff.createdAt,
    updatedAt: flaff.updatedAt,
    files: restructureData(flaff.files),
  }

  return {
    ok: true,
    message: 'flaff found',
    data: {
      ...data,
      isOwner,
    } as (FlaffWithFiles & { isOwner: boolean } & { files: FlaffWithFilesWithNestedFiles[] }),
  }
})