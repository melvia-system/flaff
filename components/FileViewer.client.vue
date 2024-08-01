<script lang="ts" setup>
import {
  LazyFileViewerImage,
  LazyFileViewerPdf,
  LazyFileViewerText,
  LazyFileViewerDefault,
} from '#components'

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

const EXT_READABLE_RESIZE_PATTERN: {
  [key: string]: string
} = {
  ps: 'text/pinescript',
  pinescript: 'text/pinescript',
  sav: 'text/sav',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  js: 'text/javascript',
  jsx: 'text/javascript',
  json: 'text/json',
  yml: 'text/yaml',
  yaml: 'text/yaml',
  md: 'text/markdown',
  markdown: 'text/markdown',
  csv: 'text/csv',
}
const getMimeType = computed(() => {
  const ext = props.item.extension
  const mime = props.item.mimeType
  if (EXT_READABLE_RESIZE_PATTERN[ext]) return EXT_READABLE_RESIZE_PATTERN[ext]
  return mime  
})

const MIME_READABLE_PATTERN = [
  'application/pdf',
  'text/*',
  'image/*',
]
const isMimeReadable = computed(() => {
  const fileMimeType = getMimeType.value // ex: 'application/pdf'
  return MIME_READABLE_PATTERN.some((pattern) => {
    return new RegExp(pattern.replace('*', '.*')).test(fileMimeType)
  })
})

const ViewerComponents = {
  'image/*': LazyFileViewerImage,
  'application/pdf': LazyFileViewerPdf,
  'text/*': LazyFileViewerText,
}

const findBypattern = (pattern: string) => {
  const findComponent = Object.entries(ViewerComponents).find(([pattern]) => {
    return new RegExp(pattern.replace('*', '.*')).test(getMimeType.value)
  })
  return findComponent?.[1]
}
const ViewerComponent = computed(() => {
  const defaultComponent = LazyFileViewerDefault
  return findBypattern(getMimeType.value) || defaultComponent
})

const forceViewerMimeType = ref<string>()
const ForceViewerComponent = computed(() => {
  if (forceViewerMimeType.value) {
    const find = findBypattern(forceViewerMimeType.value)
    if (find) return find
  }
  return ViewerComponent.value
})
</script>

<template>
  <component
    v-if="isMimeReadable || forceViewerMimeType"
    :is="ForceViewerComponent"
    :flaff-id="flaffId"
    :item="item"
    :mimeType="getMimeType"
    :flaff="flaff"
  />
  <FileViewerContainer
    v-else
    :flaff="flaff"
    :flaff-id="props.flaffId"
    :force-viewer-mime-type="forceViewerMimeType"
    :is-mime-readable="isMimeReadable"
    :item="props.item"
    :mimeType="getMimeType"
  >
    <div class="flex-1 flex justify-center items-center">
      <div class="flex flex-col justify-center items-center gap-1">
        <span>Preview Not Available</span>
        <UButton
          label="Read as Text"
          size="xs"
          @click="forceViewerMimeType = 'text/plain'"
        />
      </div>
    </div>
  </FileViewerContainer>
</template>