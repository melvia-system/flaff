<script lang="ts" setup>
const props = defineProps({
  flaffId: {
    type: String,
    required: true,
  },
  item: {
    type: Object as PropType<Item>,
    required: true,
  },
  forceViewerMimeType: {
    type: String,
  },
  isMimeReadable: {
    type: Boolean,
    default: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  flaff: {
    type: Object as PropType<Flaff>,
    required: true,
  },
})

const emits = defineEmits(['flaffUpdated'])

const $toast = useToast()

const readeableSize = computed(() => {
  const size = props.item.size // in bytes
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
})

const download = async () => {
  try {
    const res = await $fetch(`/api/flaff/${props.flaffId}/file/${props.item.uuid}`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(res)
    const a = document.createElement('a')
    a.href = url
    a.download = props.item.name
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('error', error)
  }
}

const nameMode = ref<'view' | 'edit'>('view')
watch(nameMode, (val) => {
  if (val === 'edit') {
    const dom = document.querySelector('.input-rename') as HTMLInputElement
    dom?.focus()
  }
})
const isRenameLoading = ref(false)
const rename = async () => {
  if (isRenameLoading.value) return
  isRenameLoading.value = true
  const temp = props.item.name
  try {
    const res = await $fetch(`/api/flaff/${props.flaff.uuid}/file/${props.item.uuid}/rename`, {
      method: 'PUT',
      body: JSON.stringify({
        name: props.item.name,
      }),
    })
    nameMode.value = 'view'
    console.log('res', res)
  } catch (error) {
    console.error('error', error)
    props.item.name = temp
  }
  isRenameLoading.value = false

  console.log('rename', props.item.name)
  emits('flaffUpdated')
}

const deleteFile = async () => {
  try {
    const res = await $fetch(`/api/flaff/${props.flaffId}/file/${props.item.uuid}`, {
      method: 'DELETE',
    })
    console.log('res', res)
    emits('flaffUpdated', true)
    $toast.add({
      title: 'Success',
      description: 'File deleted',
    })
  } catch (error) {
    console.error('error', error)
    $toast.add({
      title: 'Error',
      description: 'Failed to delete file',
    })
  }
}
</script>

<template>
  <UCard
    class="flex-1 flex flex-col"
    :ui="{
      body: {
        base: 'flex-1 flex overflow-y-auto',
        padding: 'p-0 sm:p-0',
      },
    }"
  >
    <template #header>
      <div class="flex justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-ph-file-duotone" />
          <span v-if="nameMode == 'view'" @dblclick="nameMode = 'edit'">{{ item.name }}</span>
          <input
            v-else
            autofocus
            v-model="item.name"
            @blur="rename"
            @keyup.enter="rename"
            class="input-rename bg-transparent border-b border-gray-500"
          />
          <!-- <span v-if="forceViewerMimeType">[{{ forceViewerMimeType }}]</span> -->
        </div>
        <div class="flex gap-2">
          <slot name="header-actions" />
          <UDropdown
            v-if="props.flaff.isOwner"
            :items="[
              [
                {
                  label: 'Rename',
                  icon: 'i-ph-pencil',
                  click: () => {
                    nameMode = 'edit'
                  },
                },
                {
                  label: 'Delete',
                  icon: 'i-ph-trash',
                  click: () => {
                    deleteFile()
                  },
                }
              ]
            ]"
            mode="hover"
            :popper="{ placement: 'bottom-end' }"
          >
            <UButton size="xs" icon="i-ph-dots-three-outline-vertical-thin" />
          </UDropdown>
        </div>
      </div>
    </template>

    <div v-if="isLoading" class="flex-1 flex justify-center items-center">
      <div class="flex items-center gap-1">
        <span>Loading Image Preview</span>
        <UIcon name="i-ph-circle-notch-duotone" class="animate-spin" />
      </div>
    </div>
    <template v-else>
      <slot />
    </template>


    <template #footer>
      <div class="flex justify-between">
        <div class="flex items-center gap-2 divide-x divide-gray-500">
          <div class="flex items-center gap-1 text-sm">
            <UIcon name="i-ph-file-duotone" />
            {{ readeableSize }}
          </div>
          <div class="pl-2 flex items-center gap-1 text-sm">
            <UIcon name="i-ph-file-duotone" />
            {{ mimeType }}
          </div>
          <slot name="footer-bar" />
        </div>
        <div class="flex gap-2">
          <slot name="footer-actions" />
          <UButton
            color="white"
            label="Download"
            icon="i-ph-download"
            size="xs"
            @click="download"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>