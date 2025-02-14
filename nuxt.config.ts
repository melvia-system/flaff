// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    '@nuxt/ui',
    'nuxt-monaco-editor',
    '@vueuse/nuxt',
  ],

  nitro: {
    plugins: [
      `~/server/plugins/db.ts`
    ]
  },
})