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

  const supportedThemes = ['auto', 'light', 'dark'] as const
  const theme: Ref<(typeof supportedThemes)[number]> = ref('auto')

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

  function updateTheme(t: (typeof supportedThemes)[number]) {
    const isDark =
      t === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : t === 'dark'

    console.log('called the watcher', t, isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // toggle dark class on the html node
  watch(theme, updateTheme)

  return {
    interfaceLocale,
    numberLocale,
    supportedInterfaceLocales,
    supportedNumberLocales,
    theme,
    supportedThemes,
    updateTheme,
    /**
     * See localStoragePlugin
     */
    persist: true,
  }
})
