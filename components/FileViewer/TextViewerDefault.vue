<script lang="ts" setup>
import { marked } from 'marked'

const props = defineProps({
  data: {
    type: String,
    required: true,
  },
})

const displayData = computed(() => props.data.replaceAll('\n', '<br>'))
</script>

<template>
  <div v-html="displayData"></div>
</template>