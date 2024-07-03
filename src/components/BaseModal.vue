<script setup lang="ts">
defineProps({
  header: {
    type: String,
    default: 'Modal',
  },
  show: Boolean,
  modalClasses: String,
})

defineEmits<{ (e: 'close'): void }>()
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
      @click="$emit('close')"
    >
      <!-- div that is actually the size of the screen, to center the modal -->
      <div class="flex h-screen w-screen items-center justify-center">
        <!-- modal -->
        <div
          :class="`modal-container flex max-h-full max-w-full flex-col rounded-lg bg-white shadow-2xl transition-transform ${modalClasses}`"
          @click="$event.stopPropagation()"
        >
          <!-- modal header -->
          <div
            class="flex items-center justify-between border-0 border-b border-solid border-gray-200"
          >
            <h2
              class="color-gray-900 m-0 ml-5 text-base font-medium leading-none"
            >
              {{ header }}
            </h2>
            <i
              class="material-icons flex h-14 w-14 cursor-pointer select-none items-center justify-center text-lg text-gray-400"
              @click="$emit('close')"
              :title="`Close ${header} Modal`"
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
