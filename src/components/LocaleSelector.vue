<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>
<template>
  <p class="flex items-center">
    <i class="material-icons mr-2">language</i
    ><span>{{ $t('locale.title') }}</span>
  </p>
  <div class="flex gap-2">
    <!-- Interface Locale -->
    <div class="grow">
      <label for="interface-locale" class="nt-form-label block text-center">{{
        $t('locale.interface')
      }}</label>
      <label for="interface-locale" class="nt-select">
        <select
          class="nt-form-input"
          name="interface-locale"
          id="interface-locale"
          v-model="settings.interfaceLocale"
        >
          <option
            v-for="locale in settings.supportedInterfaceLocales"
            :key="`interface-${locale}`"
            :value="locale"
          >
            {{ locale }}
          </option>
        </select>
      </label>
    </div>
    <!-- Number Locale -->
    <div class="grow">
      <label for="number-locale" class="nt-form-label block text-center">{{
        $t('locale.number')
      }}</label>
      <label for="number-locale" class="nt-select">
        <select
          class="nt-form-input"
          name="number-locale"
          id="number-locale"
          v-model="settings.numberLocale"
        >
          <option
            v-for="locale in settings.supportedNumberLocales"
            :key="`number-${locale}`"
            :value="locale"
          >
            {{ locale }}
          </option>
        </select>
      </label>
    </div>
  </div>
</template>
