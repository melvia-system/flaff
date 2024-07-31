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
</script>

<template>
  <UCard
    class="flex-1 flex flex-col"
    :ui="{
      body: {
        base: 'flex-1 flex',
        padding: 'p-0 sm:p-0',
      },
    }"
  >
    <template #header>
      <div class="flex justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-ph-file-duotone" />
          <span>{{ item.name }}</span>
          <span v-if="forceViewerMimeType">[{{ forceViewerMimeType }}]</span>
        </div>
        <div>
          <slot name="header-actions" />
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
            {{ item.mimeType }}
          </div>
        </div>
        <div>
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