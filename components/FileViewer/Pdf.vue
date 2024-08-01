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

const emits = defineEmits(['flaffUpdated'])
</script>

<template>
  <FileViewerContainer
    :item="props.item"
    :flaff-id="props.flaffId"
    :is-mime-readable="true"
    :flaff="props.flaff"
    mimeType="application/pdf"
    @flaff-updated="(...args: any) => $emit('flaffUpdated', ...args)"
  >
    <div class="flex-1 flex justify-center items-center">
      <!-- embed pdf  -->
      <embed
        ref="embedPreview"
        class="flex-1 h-full w-full"
        type="application/pdf"
        :src="`/api/flaff/${flaffId}/file/${item.uuid}`"
      />
    </div>
  </FileViewerContainer>
</template>