<script lang="ts" setup>
import MonacoEditor from 'monaco-editor-vue3'
// import hljs from 'highlight.js/lib/core'

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

const datatext = ref<string>('')
const language = ref<string>()
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
  const ext = props.item.mimeType
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
</script>

<template>
  <FileViewerContainer
    :isLoading="isLoading"
    :item="props.item"
    :flaff-id="props.flaffId"
    :is-mime-readable="true"
    mimeType="text/*"
    :flaff="flaff"
  >
    <template v-if="props.flaff.isOwner" #header-actions>
      <UButton
        @click="save"
        icon="i-ph-upload"
        size="xs"
        label="Save"
      />
    </template>
    <div class="flex flex-1 w-full h-full">
      <MonacoEditor
        theme="vs-dark"
        :options="{
          colorDecorators: true,
          lineHeight: 24,
          tabSize: 2,
          automaticLayout: true
        }"
        :language="getLang"
        v-model:value="datatext"
      />
    </div>
  </FileViewerContainer>
</template>