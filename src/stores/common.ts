import type { PiniaPluginContext } from 'pinia'

/**
 * Simple Pinia plugin that saves the store's data in localStorage on changes and retreives it on load
 *
 * Only applies to stores that have a `persist` key
 */
export function localStoragePlugin(context: PiniaPluginContext) {
  if (context.store.hasOwnProperty('persist')) {
    const storedStringData = localStorage.getItem(context.store.$id)
    if (storedStringData) {
      try {
        const storedData = JSON.parse(storedStringData)
        if (storedData) {
          context.store.$patch(storedData)
        }
      } catch (e) {}
    }
    const save = () => {
      localStorage.setItem(
        context.store.$id,
        JSON.stringify(context.store.$state)
      )
    }
    context.store.$subscribe(save)
    context.store.$onAction(save)
  }
}
