<script lang="ts" setup>
const $route = useRoute()
const flaffId = $route.params.flaffId as string
import { FetchError} from 'ofetch'

const toast = useToast()

const { data, refresh } = await useFetch(`/api/flaff/${flaffId}`, {
  method: 'GET',
  query: {
    flaffId,
  }
})
const isOwner = computed(() => {
  return data.value?.data?.isOwner || false
})

// const items = ref<Item[]>([])
const items = computed<Item[]>(() => {
  return data.value?.data?.files || []
})
const selectedItem = ref<Item | null>(null)

const ICONS_ITEMS_LIST: {
  [key: string]: {
    [key: string]: string
  }
} = {
  folder: {
    default: 'i-ph-folder',
  },
  file: {
    default: 'i-ph-file',
    pdf: 'i-ph-file-pdf',
    txt: 'i-ph-file-txt',
    md: 'i-ph-markdown-logo',
    jpg: 'i-ph-file-jpg',
    jpeg: 'i-ph-file-jpg',
    png: 'i-ph-file-png',
  }
}
const getIcon = (item: Item) => {
  const ext = item.extension
  const type = item.type
  return ICONS_ITEMS_LIST[type][ext] || ICONS_ITEMS_LIST[type].default
}

const fileInput = ref<HTMLInputElement | null>(null)
const triggerUploadFile = async () => {
  // open dialog to select file
  fileInput.value?.click()
}
const handleUploadFile = async (event: Event) => {
  // upload file
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // validation size
  // max size is 4 mega bytes
  const maxSize = 4 * 1024 * 1024 // 4 MB
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
  try {
    const res = await $fetch(`/api/flaff/${data.value?.data.uuid}/file`, {
      method: 'POST',
      body: formData,
    })
    console.log('res', res)
    refresh()
  } catch (error) {
    console.error('error', error)
    toast.add({
      title: 'Error',
      description: `Failed to create new flaff`,
    })
  }

  // reset file input
  target.value = ''
}

const selectItem = (item: Item) => {
  selectedItem.value = null
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
</script>

<template>
  <div class="w-full min-h-screen bg-slate-950 flex">
    <UContainer class="flex-1 flex py-8">
      <div class="flex flex-col gap-4 flex-1">
        <UCard>
          <div class="flex justify-between items-center">
            <div>
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
                />
              </div>
            </div>
          </div>
        </UCard>
        <div class="flex-1 flex gap-4">
          <div class="max-w-[300px] w-[300px] flex">
            <UCard class="max-w-[300px] w-[300px] flex-1">
              <div class="flex justify-between">
                <div class="font-semibold text-lg">Explorer</div>
                <div v-if="isOwner" class="mb-4 flex gap-2 justify-end">
                  <UButton
                    icon="i-ph-plus"
                    @click="triggerUploadFile"
                    size="xs"
                  />
                  <UButton
                    icon="i-ph-repeat"
                    @click="refresh"
                    size="xs"
                  />
                  <input
                    ref="fileInput"
                    type="file"
                    style="display: none;"
                    @change="handleUploadFile"
                  />
                </div>
              </div>
              <div>
                <template v-for="(item, i) in items" :key="item.uuid">
                  <UButton
                    class="w-full text-left truncate"
                    :label="item.name"
                    :icon="getIcon(item)"
                    :variant="selectedItem === item ? 'solid' : 'ghost'"
                    @click="() => selectItem(item)"
                  />
                  <!-- <button
                    class="text-left truncate w-full"
                  >
                    {{ item.name }}
                  </button> -->
                </template>
              </div>
            </UCard>
          </div>
          <div v-if="selectedItem && data?.data" class="flex-1 flex">
            <ClientOnly>
              <FileViewer
                :flaff-id="flaffId"
                :item="selectedItem"
                :flaff="data?.data"
              />
            </ClientOnly>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>