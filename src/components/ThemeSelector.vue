<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>
<template>
  <!-- Theme -->
  <label for="interface-locale" class="nt-form-label flex items-center">
    <i class="material-icons mr-2">contrast</i
    ><span>{{ $t('theme.title') }}</span>
  </label>
  <label for="interface-locale" class="nt-select">
    <select
      class="nt-form-input"
      name="interface-locale"
      id="interface-locale"
      v-model="settings.theme"
    >
      <option
        v-for="theme in settings.supportedThemes"
        :key="`theme-${theme}`"
        :value="theme"
      >
        {{ $t(`theme.${theme}`) }}
      </option>
    </select>
  </label>
</template>
