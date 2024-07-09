import './main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

import App from './App.vue'
import router from './router'
import { localStoragePlugin } from './stores/common'
import { plugin } from '@formkit/vue'
import formkitConfig from '../formkit.config'

const app = createApp(App)
const pinia = createPinia()
pinia.use(localStoragePlugin)

type MessageSchema = typeof en
const i18n = createI18n<[MessageSchema], 'en' | 'fr'>({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    fr,
  },
})

app.use(pinia)
app.use(router)
app.use(plugin, formkitConfig)
app.use(i18n)

app.mount('#app')
