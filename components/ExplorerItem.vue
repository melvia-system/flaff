<script lang="ts" setup>
const props = defineProps({
  files: {
    type: Array as PropType<Item[]>,
    required: true,
  },
  selectedItem: {
    type: Object as PropType<Item>,
    default: undefined,
  },
  level: {
    type: Number,
    default: 0,
  },
  flaff: {
    type: Object as PropType<Flaff>,
    required: true,
  }
})

// defineEmits(['selectItem'])
const emits = defineEmits(['selectItem', 'flaffUpdated'])

const $toast = useToast()



const isTargetDragOver = ref<Item>()
const onDragOver = (target: Item) => (e: DragEvent) => {
  e.preventDefault()
  isTargetDragOver.value = target
}
const onDrop = (target: Item) => async (e: DragEvent) => {
  if (!props.flaff.isOwner) return
  e.preventDefault()
  const data = e.dataTransfer?.getData('application/json')
  
  let item: Item | undefined
  try {
    item = JSON.parse(data || '')
  } catch (e) {
    console.error('Error parsing dropped data', e)
  }

  if (item && item.uuid && target && target.uuid) {
    // get target folder
    const _target = getParentFolder(props.files, target.uuid)
    
    try {
      const res = await $fetch(`/api/flaff/${props.flaff.uuid}/file/${item.uuid}/move`, {
        method: 'POST',
        body: JSON.stringify({
          fileId: item.uuid,
          targetId: _target?.uuid,
        }),
      })
      console.log('res', res)
      emits('flaffUpdated')
    } catch (error) {
      console.error(error)
      $toast.add({
        title: 'Error',
        description: 'Error moving file',
      })
    }
  }
}
const onDragStart = (item: Item) => (e: DragEvent) => {
  e.dataTransfer?.setData('application/json', JSON.stringify(item))
  console.log('drag start', e)
}
</script>

<template>
  <div
    v-for="(item, i) in files" :key="item.uuid + i"
    class="flex-1 w-full flex flex-col"
    :style="{
      paddingRight: level > 1 ? (`${level * 0}px`) : (level > 0 ? `${level * 24}px` : undefined),
      // backgroundColor: `rgba(${level * 50}, ${level * 50}, ${level * 50}, 1)`,
    }"
  >
    <UButton
      @dragover.prevent="(e) => onDragOver(item)(e)"
      @dragleave.prevent="() => isTargetDragOver = undefined"
      :draggable="flaff.isOwner"
      @drop="(e) => onDrop(item)(e)"
      @dragstart="(e) => onDragStart(item)(e)"
      class="text-left truncate w-full"
      :style="{
        marginLeft: level > 1 ? `${level * 12}px` : (level > 0 ? `${level * 24}px` : undefined),
      }"
      :label="item.name"
      :icon="getIcon(item)"
      :variant="selectedItem === item ? 'solid' : 'ghost'"
      @click="() => $emit('selectItem', item)"
      :class="{
        'border-2 border-dashed border-gray-400': isTargetDragOver === item,
      }"
    />
    <div
      class="flex flex-col relative flex-1"
      :style="{
        paddingLeft: level > 1 ? `${level * 24}px` : (level > 0 ? `${level * 24}px` : undefined),
      }"
    >
      <div class="absolute w-2 h-full flex pl-5 py-[2px]">
        <div class="border-l border-gray-400 border-dashed flex-1" />
      </div>
      <ExplorerItem
        :flaff="flaff"
        :level="level + 1"
        :files="item.files"
        :selectedItem="selectedItem"
        @selectItem="(item) => $emit('selectItem', item)"
        @flaffUpdated="() => $emit('flaffUpdated')"
      />
    </div>
  </div>
</template>