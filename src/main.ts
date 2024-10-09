import './assets/main.css'
import '@fontsource-variable/inter'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'

import en_au from './locales/en_au'

const app = createApp(App)

const i18n = createI18n({
  legacy: false,
  locale: 'en_au',
  fallbackLocale: 'en_au',
  messages: {
    en_au
  }
})

const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(router)

app.mount('#app')

console.group('Conductor')
console.log('By Electronic Mobility Co - Jayden Sim')
console.log(
  'Release:',
  (import.meta.env.CF_PAGES_COMMIT_SHA || 'dev').split('').slice(0, 7).join('') +
    ' on branch ' +
    (import.meta.env.CF_PAGES_BRANCH || 'dev')
)
console.log("You're cool. Thanks for checking this out :)")
console.groupEnd()
