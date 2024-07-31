import { createStorage } from "unstorage"
import fsDriver from "unstorage/drivers/fs-lite"

const storage = createStorage({
  driver: fsDriver({
    base: './storages/uploads'
  })
})

export { storage }