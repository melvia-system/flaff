import { e as createStorage, f as fsDriver } from '../runtime.mjs';

const storage = createStorage({
  driver: fsDriver({
    base: "./storages/uploads"
  })
});

export { storage as s };
//# sourceMappingURL=storage.mjs.map
