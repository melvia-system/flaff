<script lang="ts" setup>
import {
  LazyFileViewerTextViewerMarkdown,
  LazyFileViewerTextViewerDefault,
} from '#components'
import type * as monaco from 'monaco-editor'
// import MonacoEditor from 'monaco-editor-vue3'
// import hljs from 'highlight.js/lib/core'
import themejson from 'monaco-themes/themes/GitHub Dark.json';

const $monaco = useMonaco();
if ($monaco) {
  $monaco.editor.defineTheme('GitHubDark', themejson as monaco.editor.IStandaloneThemeData);
  $monaco.editor.setTheme('GitHubDark');
}

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
  mimeType: {
    type: String,
    required: true,
  },
})

const emits = defineEmits(['flaffUpdated', 'changeFileByName'])

const datatext = ref<string>('')
const language = ref<string>()
const options = computed<monaco.editor.IEditorConstructionOptions>(() => ({
  automaticLayout: true,
  readOnly: !props.flaff.isOwner,
  width: '100%',
  height: '100%',
}))
const $toast = useToast()

const isLoading = ref(true)
const fetch = async () => {
  isLoading.value = true
  try {
    const res = await $fetch(`/api/flaff/${props.flaffId}/file/${props.item.uuid}`, {
      responseType: 'blob',
    })
    // res is blob
    const blobl = res
    const text = await blobl.text()
    datatext.value = text
  } catch (error) {
    console.error('error', error)
  }
  isLoading.value = false
}

onMounted(() => {
  fetch()
})

const getLang = computed(() => {
  const def = 'text/plain'
  const ext = props.mimeType
  const lang = ext.split('/')[1] || def
  return lang
})

const save = async () => {
  try {
    // convert file to dom file object
    const file = new File([datatext.value], props.item.name, {
      type: props.item.mimeType,
    })

    const formData = new FormData();
    formData.append('file', file);

    const res = await $fetch(`/api/flaff/${props.flaffId}/file/${props.item.uuid}`, {
      method: 'PUT',
      body: formData,
    })
    console.log('res', res)
    $toast.add({
      title: 'Success',
      description: 'File saved',
    })
  } catch (error) {
    console.error('error', error)
    $toast.add({
      title: 'Error',
      description: 'Failed to save file',
    })
  }
}

const tabCurrentSelected = ref<'editor'|'viewer'>('editor')

const VIEWER_SUPPORT = [
  'markdown',
]
onMounted(() => {
  if (VIEWER_SUPPORT.includes(getLang.value)) {
    tabCurrentSelected.value = 'viewer'
  }
})

const ViewerComponentsList: {
  [key: string]: Component
} = {
  'markdown': LazyFileViewerTextViewerMarkdown,
}
const ViewerComponent = computed(() => {
  const def = LazyFileViewerTextViewerDefault
  const lang = getLang.value
  return ViewerComponentsList[lang] || def
})

const copy = async () => {
  try {
    await navigator.clipboard.writeText(datatext.value)
    $toast.add({
      title: 'Success',
      description: 'Text copied to clipboard',
    })
  } catch (error) {
    console.error('error', error)
    $toast.add({
      title: 'Error',
      description: 'Failed to copy text to clipboard',
    })
  }
}
</script>

<template>
  <FileViewerContainer
    :isLoading="isLoading"
    :item="props.item"
    :flaff-id="props.flaffId"
    :is-mime-readable="true"
    mimeType="text/*"
    :flaff="flaff"
    @flaff-updated="(...args: any) => $emit('flaffUpdated', ...args)"
  >
    <template #header-actions>
      <UButton
        v-if="tabCurrentSelected == 'editor' && props.flaff.isOwner"
        @click="save"
        icon="i-ph-upload"
        size="xs"
        label="Save"
      />
      <UButton
        v-if="tabCurrentSelected == 'editor'"
        @click="copy"
        icon="i-ph-copy"
        size="xs"
        label="Copy to clipboard"
      />
    </template>
    <div class="flex flex-1 w-full h-full">
      <template v-if="tabCurrentSelected == 'editor'">
        <MonacoEditor
          v-model="datatext"
          :language="getLang"
          :lang="getLang"
          :options="options"
          class="editor w-[100%]"
          width="100%"
          height="100%"
          the
        />
      </template>
      <template v-else>
        <component
          :is="ViewerComponent"
          :flaff-id="props.flaffId"
          :item="props.item"
          :flaff="flaff"
          :mimeType="props.mimeType"
          :data="datatext"
          @changeFileByName="(name: string) => $emit('changeFileByName', name)"
        />
      </template>
      <!-- <MonacoEditor
        theme="vs-dark"
        :options="{
          colorDecorators: true,
          lineHeight: 24,
          tabSize: 2,
          automaticLayout: true
        }"
        :language="getLang"
        v-model:value="datatext"
      /> -->
    </div>
    <template #footer-bar>
      <span class="text-sm pl-2 text-slate-200">
        Lang: {{ getLang }}
      </span>
    </template>
    <template #footer-actions>
      <div>
        <UButton
          :color="tabCurrentSelected == 'viewer' ? undefined : 'white'"
          label="Viewer"
          icon="i-ph-eye"
          size="xs"
          class="rounded-r-none"
          @click="tabCurrentSelected = 'viewer'"
        />
        <UButton
          :color="tabCurrentSelected == 'editor' ? undefined : 'white'"
          label="Editor"
          icon="i-ph-code"
          size="xs"
          class="rounded-l-none"
          @click="tabCurrentSelected = 'editor'"
        />
      </div>
    </template>
  </FileViewerContainer>
</template>