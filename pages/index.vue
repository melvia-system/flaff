<script lang="ts" setup>
const toast = useToast()
const newFlaff = async () => {
  try {
    const { data } = await $fetch('/api/flaff', {
      method: 'POST',
    })
    if (data) {
      return navigateTo(`/flaff/${data.ownerLink}`)
    }
    throw new Error('Failed to create new flaff')
  } catch (error) {
    console.error('error', error)
    toast.add({
      title: 'Error',
      description: `Failed to create new flaff`,
    })
  }
}
</script>

<template>
  <div class="w-screen min-h-screen bg bg-gradient-to-tr from-sky-700 via-sky-900 to-slate-950">
    <div class="w-screen min-h-screen flex justify-center items-center">
      <div class="flex flex-col">
        <div class="text-center mb-4">
          <h1 class="text-4xl bg-gradient-to-r from-rose-400 to-sky-300 bg-clip-text text-transparent">
            <UIcon name="i-game-icons-fluffy-cloud" />
            share your files with ease
          </h1>
          <!-- <p class="text-center">
            <span class="text-rose-300">Easy</span> <span class="text-sky-300">Share</span> 
            <span class="text-gray-300 pl-1">Anywhere</span>
          </p> -->
        </div>
        <div class="flex justify-center">
          <UButton label="New Flaff" @click="newFlaff" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg {
  // background: rgb(12,74,110);
  // background: linear-gradient(49deg, rgba(12,74,110,1) 0%, rgba(7,89,133,1) 50%, rgba(15,23,42,1) 100%);
  // background-image: linear-gradient(49deg, rgba(12,74,110,1) 0%, rgba(7,89,133,1) 50%, rgba(15,23,42,1) 100%);
  // background-size: cover;
  // background-clip: border-box;
  // background-origin: padding-box;

  & > div {
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    background-color: rgba(17, 25, 40, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.125);
  }
}
</style>