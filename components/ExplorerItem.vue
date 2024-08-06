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
  isTargetDragOver.value = target
  e.preventDefault()
}
const onDragLeave = (target: Item) => (e: DragEvent) => {
  e.preventDefault()
  isTargetDragOver.value = undefined
}
const onDrop = (target: Item) => async (e: DragEvent) => {
  if (!props.flaff.isOwner) return
  e.preventDefault()
  isTargetDragOver.value = undefined
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
    
    // return console.log('target drop', _target)
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

const isItemDrag = ref<Item>()
const onDragStart = (item: Item) => (e: DragEvent) => {
  isItemDrag.value = item
  e.dataTransfer?.setData('application/json', JSON.stringify(item))
  console.log('drag start', e)
}
const onDragEnd = (item: Item) => (e: DragEvent) => {
  isItemDrag.value = undefined
}
</script>

<template>
  <div
    v-for="(item, i) in files" :key="item.uuid + i"
    class="w-full flex flex-col justify-start items-start"
    :style="{
      paddingRight: level > 1 ? (`${level * 0}px`) : (level > 0 ? `${level * 24}px` : undefined),
      // backgroundColor: `rgba(${level * 50}, ${level * 50}, ${level * 50}, 1)`,
    }"
  >
    <UButton
      @dragover.prevent="(e) => onDragOver(item)(e)"
      @dragleave.prevent="(e) => onDragLeave(item)(e)"
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
        'border-2 border-dashed border-transparent': isTargetDragOver !== item,
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
  <div 
    v-if="level == 0 && isItemDrag !== undefined"
    class="text-sm text-gray-500 mt-2 border border-gray-400/50 border-dashed rounded p-2 py-1"
  >
    <div>drophere root level</div>
  </div>
</template>