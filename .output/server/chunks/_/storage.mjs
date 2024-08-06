import path from 'path';
import { e as createStorage, f as fsDriver } from '../runtime.mjs';

const storagepath = path.join(process.cwd(), `${process.env.STORAGE_PATH || "./storages/uploads"}`);
const storage = createStorage({
  driver: fsDriver({
    // base: process.env.STORAGE_PATH || './storages/uploads'
    base: storagepath
  })
});

export { storage as s };
//# sourceMappingURL=storage.mjs.map
