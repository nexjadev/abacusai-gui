<script setup lang="ts">
// import { Message } from '../../services/database.ts'
import { avatarUrl, enableMarkdown } from '../../services/appConfigAbacus.ts'
import Markdown from '../Markdown.ts'
import { History } from '../../services/apiAbacus2.ts'
import { ref, computed } from 'vue'
import { useChats } from '../../services/chatAbacus2.ts'

type Props = {
  message: History
}

const { message } = defineProps<Props>()
const emit = defineEmits(['updateMessage'])
const { messages } = useChats()

const isEditing = ref(false)
const editedText = ref('')
const isHovered = ref(false)

const hasTextChanged = computed(() => {
  return editedText.value !== message.text
})

const isEditable = computed(() => {
  const lastUserMessage = messages.value.slice().reverse().find(m => m.role === 'USER')
  return lastUserMessage?.messageIndex === message.messageIndex
})

const startEditing = () => {
  editedText.value = message.text
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editedText.value = ''
}

const saveEdit = () => {
  emit('updateMessage', { ...message, text: editedText.value })
  isEditing.value = false
}
</script>

<template>
  <div
    class="flex justify-end items-center max-w-5xl mx-auto"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <button v-if="isHovered && !isEditing && isEditable"
      class="p-2 mr-2 rounded-full bg-purple-500/30 hover:bg-purple-500/50 transition-colors"
      @click="startEditing"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>

    <div v-if="isEditing" class="w-full sm:w-4/5">
      <textarea
        v-model="editedText"
        class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="3"
      ></textarea>
      <div class="flex justify-end gap-2 mt-2">
        <button
          @click="cancelEditing"
          class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="saveEdit"
          :disabled="!hasTextChanged"
          class="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar
        </button>
      </div>
    </div>

    <div v-else class="w-full sm:w-4/5">
      <div class="flex justify-end rounded-xl bg-gray-100 my-2 px-2 py-4 sm:px-4 flex flex-row">
        <div class="flex items-center justify-center max-w-3xl">
          <code v-if="!enableMarkdown" class="whitespace-pre-line text-gray-900 dark:text-gray-100">
            {{ message.text }}
          </code>
          <div
            v-else
            class="prose prose-base max-w-full dark:prose-invert prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-p:text-gray-900 prose-p:first:mt-0 prose-a:text-blue-600 prose-code:text-sm prose-code:text-gray-900 prose-pre:p-2 dark:prose-p:text-gray-100 dark:prose-code:text-gray-100"
          >
            <Markdown :source="message.text" />
          </div>
        </div>
        <img v-if="avatarUrl" class="ml-2 flex size-9 rounded-full sm:ml-4 bg-gray-200" :src="avatarUrl" />
        <div
          v-else
          class="mr-2 flex size-10 aspect-square items-center justify-center rounded-full bg-white text-center text-2xl dark:bg-gray-600 sm:mr-4"
        >
        </div>
      </div>
    </div>
  </div>
</template>
