import './main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { localStoragePlugin } from './stores/common'
import { plugin } from '@formkit/vue'
import formkitConfig from '../formkit.config'

const app = createApp(App)
const pinia = createPinia()
pinia.use(localStoragePlugin)

app.use(pinia)
app.use(router)
app.use(plugin, formkitConfig)

app.mount('#app')
