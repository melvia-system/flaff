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

const emits = defineEmits(['flaffUpdated', 'changeFileByUuid'])

// const menus = computed(() => {
//   return [...props.item.files.sort((a, b) => a.mimeType === 'application/x-directory' ? -1 : 1)]
// })
</script>

<template>
  <FileViewerContainer
    :item="props.item"
    :flaff-id="props.flaffId"
    :is-mime-readable="true"
    :flaff="props.flaff"
    mimeType="application/x-directory"
    @flaff-updated="(...args: any) => $emit('flaffUpdated', ...args)"
  >
    <div class="px-6 py-4 flex flex-col gap-2 w-full flex-1">
      <UButton
        v-for="menu in item.files"
        :key="menu.uuid"
        :label="menu.name"
        variant="ghost"
        :icon="getIcon(menu)"
        @click="() => $emit('changeFileByUuid', menu.uuid)"
      />
    </div>
  </FileViewerContainer>
</template>