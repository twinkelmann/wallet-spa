<script setup lang="ts">
defineProps({
  header: {
    type: String,
    default: 'Modal',
  },
  show: Boolean,
  modalClasses: String,
})

const emit = defineEmits<{ (e: 'close'): void }>()

let canClickToClose = true

function preventClose() {
  canClickToClose = false
}

function allowClose(event: MouseEvent) {
  event.stopPropagation()
  canClickToClose = true
}

function attemptClose() {
  if (canClickToClose) {
    emit('close')
  } else {
    canClickToClose = true
  }
}
</script>
<template>
  <Transition name="modal">
    <!-- modal backdrop -->
    <!--
  the backdrop has the transformation to avoid creating a new containing block on the modal body
  therefore it needs to be twice the height of the screen, to cover it even when it is moved up
-->
    <div
      v-if="show"
      class="absolute left-0 top-0 z-[2000] h-screen w-screen bg-black/75 transition-opacity"
      @mouseup="attemptClose()"
    >
      <!-- div that is actually the size of the screen, to center the modal -->
      <div class="flex h-screen w-screen items-center justify-center">
        <!-- modal -->
        <div
          :class="`modal-container flex max-h-full max-w-full flex-col rounded-lg bg-white shadow-2xl transition-transform dark:bg-zinc-900 ${modalClasses}`"
          @mousedown="preventClose()"
          @mouseup="allowClose($event)"
        >
          <!-- modal header -->
          <div
            class="flex items-center justify-between border-0 border-b border-solid border-zinc-200 dark:border-zinc-800"
          >
            <h2
              class="m-0 ml-5 text-base font-medium leading-none text-zinc-900 first-letter:uppercase dark:text-zinc-100"
            >
              {{ header }}
            </h2>
            <i
              class="material-icons nt-clickable flex h-14 w-14 items-center justify-center text-lg text-zinc-400 dark:text-zinc-500"
              @click="$emit('close')"
              :title="$t('close-modal', { name: header })"
              >close</i
            >
          </div>

          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(1.1);
}
</style>
