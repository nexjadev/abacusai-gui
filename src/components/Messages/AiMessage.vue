<script setup lang="ts">
import Markdown from '../Markdown.ts'
import 'highlight.js/styles/github-dark.css'
import { computed, ref } from 'vue'
import { useConfig } from '../../services/appConfig.ts'
import { useChats } from '../../services/chat.ts'
import AiMessageActions from './AiMessageActions.vue'
import { Message } from '../../dtos/message.dto.ts'
import { useAI } from '../../services/useAi.ts'

const { getRoutingDictionary, getNickImageDictionary } = useConfig()
const { activeModel, messages } = useChats()
const { availableModels } = useAI()

type Props = {
  message: Message
}

const { message } = defineProps<Props>()

// Determinar si el mensaje actual es el último mensaje de tipo BOT
const isLastBotMessage = computed(() => {
  const reversedMessages = [...messages.value].reverse()
  const firstBotIndex = reversedMessages.findIndex(m => m.role == 'assistant')
  return firstBotIndex !== -1 && reversedMessages[firstBotIndex].id === message.id
})

const getLlmModel = (llm_model_id: string) => {
  const model = availableModels.value.find((m) => m.id == llm_model_id)
  return model ? model : null
}
</script>

<template>
  <div class="flex rounded-xl max-w-5xl mx-auto px-2 py-6 dark:bg-gray-800 sm:px-4">
    <img class="mr-2 mt-7 flex size-9 aspect-square rounded-full border border-gray-200 bg-white object-contain sm:mr-4"
         :src="getLlmModel(message.llm_model_id ?? '')?.image_url ?? 'nope-not-here.webp'" :alt="getLlmModel(message.llm_model_id ?? '')?.description || 'Not Found Image'" />
    <div class="flex flex-col rounded-xl w-full">
      <!-- Contenido normal -->
      <div class="prose prose-base max-w-full dark:prose-invert">
        <Markdown :source="message.content" />
      </div>
      <AiMessageActions v-if="isLastBotMessage" :message="message" />
    </div>
  </div>
</template>

<style scoped>
.prose {
  font-size: 1rem;
  line-height: 1.5;
}

.prose ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.prose li {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.prose code {
  font-family: monospace;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}

.prose pre {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
}

.dark .prose code {
  background-color: rgba(255, 255, 255, 0.1);
}

details {
  margin-bottom: 1rem;
}

details summary {
  margin-bottom: 0.5rem;
}

.min-w-48 {
  min-width: 12rem;
}

/* Estilos para el botón de copiar */
:deep(.copy-button) {
  opacity: 0;
  transition: opacity 0.2s;
}

:deep(.relative:hover .copy-button) {
  opacity: 1;
}
</style>
