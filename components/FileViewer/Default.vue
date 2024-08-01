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
    :flaff="flaff"
    mimeType="text/*"
    @flaff-updated="(...args: any) => $emit('flaffUpdated', ...args)"
  >
    <div>default</div>
  </FileViewerContainer>
</template>