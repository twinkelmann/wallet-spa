<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useSettingsStore } from './stores/settings'
const settings = useSettingsStore()
// need to trigger this on page load
settings.updateTheme(settings.theme)
</script>

<template>
  <RouterView />
</template>
