<script lang="ts" setup>
const $route = useRoute()
const flaffId = $route.params.flaffId as string
import { FetchError} from 'ofetch'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'


const toast = useToast()

const password = ref<string>('')
const tempPassword = ref<string>('')
const { data, refresh, error } = await useFetch<{
  data: Flaff
}>(`/api/flaff/${flaffId}`, {
  method: 'GET',
  query: {
    password: password,
  },
})
const isOwner = computed(() => {
  return data.value?.data?.isOwner || false
})
useSeoMeta({
  title: () => data.value?.data?.title + ' | Flaff',
  description: 'Flaff is a simple file sharing service',
})
const items = ref<Item[]>([ ...(data.value?.data.files as unknown as Item[]) || [] ])
watch(data, () => {
  items.value = [ ...(data.value?.data.files as unknown as Item[]) || [] ]
})
// const items = computed<Item[]>(() => {
//   return data.value?.data?.files || []
// })
const selectedItem = ref<Item>()

const fileInput = ref<HTMLInputElement | null>(null)
const triggerUploadFile = async () => {
  // open dialog to select file
  fileInput.value?.click()
}
const handleUploadFile = async (event: Event) => {
  const selected = selectedItem.value?.uuid

  // upload file
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // validation size
  // max size is 15 mega bytes
  const maxSize = 15 * 1024 * 1024 // 15 MB
  if (file.size > maxSize) {
    toast.add({
      title: 'Error',
      description: `File size is too large, max size is 4 MB`,
    })
    return
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('link', data.value?.data.ownerLink || '');

  const id = Math.random().toString(36).substring(7)
  const uploadtoast = toast.add({
    id,
    title: 'Uploading',
    description: `Uploading ${file.name}`,
    timeout: 0,
  })
  try {
    const res = await $fetch(`/api/flaff/${data.value?.data.uuid}/file`, {
      method: 'POST',
      body: formData,
      query: {
        parent: selected,
      }
    })
    console.log('res', res)
    refresh()
    toast.update(id, {
      title: 'Success',
      description: `File uploaded`,
      timeout: 5000,
    })
  } catch (error) {
    console.error('error', error)
    toast.update(id, {
      title: 'Error',
      description: `Failed to create new flaff`,
      timeout: 5000,
    })
  }

  // reset file input
  target.value = ''
}

const selectItem = (item: Item) => {
  selectedItem.value = undefined
  setTimeout(() => {
    selectedItem.value = item
  }, 50)
}

const copyLink = (type: 'owner' | 'public') => async () => {
  const link = `${window.location.host}/flaff/` + (type === 'owner' ? data.value?.data.ownerLink : data.value?.data.guestLink)
  if (!link) return

  try {
    await navigator.clipboard.writeText(link)
    toast.add({
      title: 'Success',
      description: `Link copied to clipboard`,
    })
  } catch (error) {
    console.error('error', error)
    toast.add({
      title: 'Error',
      description: `Failed to copy link to clipboard`,
    })
  }
}

const isLoaded = ref(false)
onMounted(() => {
  if (data.value?.data?.files?.length) {
    isLoaded.value = true
    selectItem(data.value?.data?.files[0] as unknown as Item)
  }
})
watch(data, () => {
  if (data.value?.data?.files?.length && !isLoaded.value) {
    isLoaded.value = true
    selectItem(data.value?.data?.files[0] as unknown as Item)
  }
})

// MODALS
const $modalSetting = (() => {
  const isShow = ref(false)
  const isLoading = ref(false)
  
  const schema = z.object({
    title: z.string(),
    publicPassword: z.string().optional(),
    ownerPassword: z.string().optional(),
  })

  type Schema = z.output<typeof schema>

  const state = reactive<Schema>({
    title: data.value?.data?.title || '',
    publicPassword: data.value?.data?.guestPassword || '',
    ownerPassword: data.value?.data?.ownerPassword || '',
  })

  watch(data, () => {
    state.title = data.value?.data?.title || ''
    state.publicPassword = data.value?.data?.guestPassword || ''
    state.ownerPassword = data.value?.data?.ownerPassword || ''
  })

  async function onSubmit (event: FormSubmitEvent<Schema>) {
    try {
      const body: {
        title: string,
        guestPassword?: string,
        ownerPassword?: string,
      } = {
        title: event.data.title,
        guestPassword: event.data.publicPassword,
        ownerPassword: event.data.ownerPassword,
      }
      // check if the password is empty, remove whitespace first
      if (!body.guestPassword?.trim()) delete body.guestPassword
      if (!body.ownerPassword?.trim()) delete body.ownerPassword

      const res = await $fetch(`/api/flaff/${data.value?.data.uuid}`, {
        method: 'PUT',
        body
      })
      console.log('res', res)
      refresh()
      toast.add({
        title: 'Success',
        description: `Settings saved`,
      })
    } catch (error) {
      console.error('error', error)
      toast.add({
        title: 'Error',
        description: `Failed to save settings`,
      })
    }
    isShow.value = false
  }
  
  return {
    modal: true,
    state,
    schema,
    onSubmit,
    isShow,
    isLoading,
  }
})()

const flaffUpdated = (reset = false) => {
  console.log('flaff updated')
  refresh()
  if (reset) {
    if (data.value?.data?.files?.length) {
      selectItem(data.value?.data?.files[0] as unknown as Item)
    }
  }
}

const changeFileByName = (name: string) => {
  console.log('change file by name', name)
  // const find = items.value.find((file) => file.name === name)
  // if (find) {
  //   selectItem(find)
  // }
  
  // search recursively in name of path / from arg name
  const paths = name.split('/')
  let find: Item | undefined = undefined
  let files = items.value
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    find = files.find((file) => file.name === path)
    if (!find) break
    if (find.type === 'folder') {
      files = find.files as unknown as Item[]
    }
  }
  if (find) {
    selectItem(find)
  }
}

const changeFileByUuid = (uuid: string) => {
  // recursively search in files because current items ahas nested files
  let find: Item | undefined = undefined
  const search = (files: Item[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.uuid === uuid) {
        find = file
        break
      }
      if (file.type === 'folder') {
        search(file.files as unknown as Item[])
      }
    }
  }
  search(items.value)
  if (find) {
    selectItem(find)
  }
}

const { width } = useWindowSize()
const isMobile = computed(() => {
  return width.value < 768
})

// MODALS
const $modalCreateFolder = (() => {
  const isShow = ref(false)
  const isLoading = ref(false)
  
  const schema = z.object({
    name: z.string(),
  })

  type Schema = z.output<typeof schema>

  const state = reactive<Schema>({
    name: '',
  })
  
  async function onSubmit (event: FormSubmitEvent<Schema>) {
    try {
      // get file id
      let selected: Item|undefined
      if (selectedItem.value) {
        if (selectedItem.value.type === 'folder') {
          selected = selectedItem.value
        } else if (selectedItem.value.fileId) {
          selected = getParentFolder(items.value, selectedItem.value?.fileId)
        }
      }
      console.log('selected', selected)

      const res = await $fetch(`/api/flaff/${data.value?.data.uuid}/file/folder`, {
        method: 'POST',
        body: JSON.stringify({
          name: event.data.name,
          fileId: selected?.uuid,
        }),
      })
      console.log('res', res)
      toast.add({
        title: 'Success',
        description: `Folder created`,
      })
      refresh()
    } catch (error) {
      console.error('error', error)
      toast.add({
        title: 'Error',
        description: `Failed to create folder`,
      })
    }
    isShow.value = false
  }

  return {
    isShow,
    isLoading,
    schema,
    state,
    onSubmit,
  }
})()

// watch(error, () => {
//   if (error.value?.statusCode == 404) {
//     throw createError({
//       statusCode: 404,
//       statusMessage: 'Flaff not found',
//     })
//   }
// })
</script>

<template>
  <div class="w-full min-h-screen max-h-screen bg-slate-950 flex">
    <template v-if="!error && data?.data?.uuid">
      <UContainer class="flex-1 flex py-8">
        <div class="flex flex-col flex-1 gap-4">
          <UCard>
            <div
              class="flex justify-between items-center"
              :class="{
                'flex-col items-center gap-2': isMobile,
                'flex-row': !isMobile,
              }"
            >
              <div :class="{ 'text-center': isMobile }">
                <h2 class="font-semibold text-xl">{{ data?.data?.title }}</h2>
                <p class="text-sm text-gray-400">{{ data?.data?.uuid }}</p>
              </div>
              <div v-if="isOwner" class="flex flex-col items-end gap-1">
                <p class="text-sm text-gray-400">You are the owner of this flaff</p>
                <div class="flex gap-2">
                  <UDropdown
                    :items="[
                      [
                        { label: 'Copy Owner Link', icon: 'i-heroicons-clipboard-20-solid', click: copyLink('owner') },
                        { label: 'Copy Public Link', icon: 'i-heroicons-clipboard-20-solid', click: copyLink('public') },
                      ]
                    ]"
                    :popper="{ placement: 'bottom-end' }"
                  >
                    <UButton color="white" trailing-icon="i-heroicons-chevron-down-20-solid" label="share" icon="i-heroicons-share-20-solid" size="xs" />
                  </UDropdown>
                  <UButton
                    icon="i-heroicons-cog-20-solid"
                    size="xs"
                    label="settings"
                    @click="$modalSetting.isShow.value = true"
                  />
                </div>
              </div>
            </div>
          </UCard>
          <div
            class="flex-1 flex gap-4"
            :class="{
              'flex-col': isMobile,
              'overflow-hidden': !isMobile,
            }"
          >
            <div
              class=""
              :class="{
                'flex-1 max-w-[300px] w-[300px]': !isMobile,
                'w-full': isMobile,
              }"
            >
              <UCard class="w-full flex-1">
                <div class="flex justify-between mb-4">
                  <div class="font-semibold text-lg">
                    Explorer
                  </div>
                  <div v-if="isOwner" class="flex gap-2 justify-end">
                    <UTooltip text="Create Folder">
                      <UButton
                        trailing-icon="i-ph-folder"
                        @click="$modalCreateFolder.isShow.value = true"
                        size="xs"
                      />
                    </UTooltip>
                    <UTooltip text="Upload File">
                      <UButton
                        icon="i-ph-upload"
                        @click="triggerUploadFile"
                        size="xs"
                      />
                    </UTooltip>
                    <UTooltip text="Refresh">
                      <UButton
                        icon="i-ph-repeat"
                        @click="refresh"
                        size="xs"
                      />
                    </UTooltip>
                    <input
                      ref="fileInput"
                      type="file"
                      style="display: none;"
                      @change="handleUploadFile"
                    />
                  </div>
                </div>
                <div class="flex flex-col">
                  <ExplorerItem
                    :flaff="data.data"
                    :files="items"
                    :selectedItem="selectedItem"
                    @selectItem="(item) => selectItem(item)"
                    @flaff-updated="flaffUpdated"
                  />
                  <!-- <template v-for="(item, i) in items" :key="item.uuid + i">
                  </template> -->
                </div>
              </UCard>
            </div>
            <div v-if="selectedItem && data?.data" class="flex-1 flex">
              <ClientOnly>
                <LazyFileViewer
                  :flaff-id="flaffId"
                  :item="selectedItem"
                  :flaff="data?.data"
                  @flaff-updated="flaffUpdated"
                  @changeFileByName="(name) => changeFileByName(name)"
                  @changeFileByUuid="(uuid) => changeFileByUuid(uuid)"
                />
              </ClientOnly>
            </div>
          </div>
        </div>
      </UContainer>
    </template>
    <div v-else-if="error && error.statusCode == 401" class="flex-1 flex items-center justify-center">
      <div>
        <UCard>
          <h2 class="font-semibold text-xl text-center">Password Required</h2>
          <p class="text-gray-400">Please enter the password to access this flaff</p>
          <UInput v-model="tempPassword" type="password" class="mt-2" placeholder="Password" @keydown.enter="() => password = tempPassword" />
          <UButton
            class="mt-2 w-full text-center justify-center"
            @click="() => password = tempPassword"
            label="Submit"
          />
        </UCard>
      </div>
    </div>
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div>
        {{ error.statusCode }} {{ error.statusMessage }}
      </div>
    </div>
    <UModal v-model="$modalSetting.isShow.value">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-xl">Settings</h2>
        </template>
        
        <UForm :schema="$modalSetting.schema" :state="$modalSetting.state" class="space-y-4" @submit="$modalSetting.onSubmit">
          <UFormGroup label="Name" name="name">
            <UInput v-model="$modalSetting.state.title" />
          </UFormGroup>

          <UFormGroup label="Public Password" name="publicPassword">
            <UInput v-model="$modalSetting.state.publicPassword" type="text" />
          </UFormGroup>

          <UFormGroup label="Owner Password" name="ownerPassword">
            <UInput v-model="$modalSetting.state.ownerPassword" type="text" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton color="red" label="Cancel" @click="$modalSetting.isShow.value = false" />
            <UButton loading-icon="i-ph-file-duotone" :loading="$modalSetting.isLoading.value" type="submit" label="Save" />
          </div>
        </UForm>
      </UCard>
    </UModal>
    <UModal v-model="$modalCreateFolder.isShow.value">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-xl">Create Folder</h2>
        </template>
        
        <UForm :schema="$modalCreateFolder.schema" :state="$modalCreateFolder.state" class="space-y-4" @submit="$modalCreateFolder.onSubmit">
          <UFormGroup label="Name" name="name">
            <UInput v-model="$modalCreateFolder.state.name" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton color="red" label="Cancel" @click="$modalCreateFolder.isShow.value = false" />
            <UButton loading-icon="i-ph-file-duotone" :loading="$modalCreateFolder.isLoading.value" type="submit" label="Create" />
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>