import { defineStore } from 'pinia'
import { ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useSettingsStore = defineStore('settings', () => {
  const i18n = useI18n()
  const supportedInterfaceLocales = ['en', 'fr'] as const
  const fallbackInterfaceLocale = 'en'
  const interfaceLocale: Ref<(typeof supportedInterfaceLocales)[number]> = ref(
    fallbackInterfaceLocale
  )

  const supportedNumberLocales = [
    'en-us',
    'fr-fr',
    'de-ch',
    'en-ch',
    'de-de',
  ] as const
  const fallbackNumberLocale = 'en-us'
  const numberLocale: Ref<(typeof supportedNumberLocales)[number]> =
    ref(fallbackNumberLocale)

  watch(interfaceLocale, (locale) => {
    i18n.locale.value = locale
  })

  return {
    interfaceLocale,
    numberLocale,
    supportedInterfaceLocales,
    supportedNumberLocales,
    /**
     * See localStoragePlugin
     */
    persist: true,
  }
})
