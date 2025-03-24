<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar'
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-y-auto">
      <div class="fixed inset-0 flex min-h-screen items-center justify-center">
        <!-- Overlay con animación -->
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

        <!-- Contenedor del diálogo -->
        <div class="relative z-[9999] w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left shadow-2xl transition-all dark:bg-gray-800 sm:max-w-lg">
          <!-- Botón de cerrar -->
          <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:text-gray-200"
              @click="$emit('close')"
            >
              <span class="sr-only">Cerrar</span>
              <IconX class="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <!-- Contenido -->
          <div class="sm:flex sm:items-start">
            <div class="mt-3 w-full text-center sm:mt-0 sm:text-left">
              <h3 class="text-2xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                {{ title }}
              </h3>
              <div class="mt-4">
                <p class="text-base text-gray-500 dark:text-gray-400">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fixed {
  position: fixed !important;
}
</style>
