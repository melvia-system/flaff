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
  flaff: {
    type: Object as PropType<Flaff>,
    required: true,
  },
})

const imagePreview = ref<HTMLImageElement | null>(null)
const isLoading = ref(true)
const fetch = async () => {
  isLoading.value = true
  try {
    console.log('fetching image preview', imagePreview.value)
    if (!imagePreview.value) return
    const res = await $fetch(`/api/flaff/${props.flaffId}/file/${props.item.uuid}`, {
      responseType: 'blob',
    })
    // res is blob
    const blobl = res
    const url = URL.createObjectURL(blobl)
    imagePreview.value.src = url
  } catch (error) {
    console.error('error', error)
  }
  isLoading.value = false
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <FileViewerContainer
    isLoading:isLoading
    :item="props.item"
    :flaff-id="props.flaffId"
    :is-mime-readable="true"
    mimeType="image/*"
    :flaff="flaff"
  >
    <div class="flex-1 flex justify-center items-center">
      <div v-show="!isLoading" class="flex-1 flex justify-center items-center">
        <img
          ref="imagePreview"
          class="max-w-full max-h-full"
          alt="Image Preview"
        />
      </div>
    </div>
  </FileViewerContainer>
</template>