<script setup lang="ts">
import Markdown from '../Markdown.ts'
import 'highlight.js/styles/github-dark.css'
import { computed, ref } from 'vue'
import { History } from '../../services/api.ts'
import { useConfig } from '../../services/appConfig.ts'
import { useChats } from '../../services/chat.ts'
import AiMessageActions from './AiMessageActions.vue'

const { getRoutingDictionary, getNickImageDictionary } = useConfig()
const { activeModel, messages } = useChats()

type Props = {
  message: History
}

const { message } = defineProps<Props>()

// Determinar si el mensaje actual es el último mensaje de tipo BOT
const isLastBotMessage = computed(() => {
  const reversedMessages = [...messages.value].reverse()
  const firstBotIndex = reversedMessages.findIndex(m => m.role === 'BOT')
  return firstBotIndex !== -1 && reversedMessages[firstBotIndex].messageIndex === message.messageIndex
})
</script>

<template>
  <div class="flex rounded-xl max-w-5xl mx-auto px-2 py-6 dark:bg-gray-800 sm:px-4">
    <img :src="getNickImageDictionary(message.llmBotIcon || '')" :alt="message.llmDisplayName || 'AI'"
      class="mr-2 mt-7 flex size-9 aspect-square rounded-full border border-gray-200 bg-white object-contain sm:mr-4"/>
    <div class="flex flex-col rounded-xl w-full">
      <span class="font-medium !text-[12px] ml-0.5 flex items-center gap-1 text-gray-600 dark:text-gray-400">
        {{ message.llmDisplayName || activeModel?.name }}
        <div v-if="message.routedLlm" class="flex items-center gap-1">
          <svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" /></svg>
          {{ getRoutingDictionary(message.routedLlm ?? '') }}
        </div>
      </span>
      <div v-for="(content, index) in message.segments" :key="index">
        <!-- Contenido colapsable -->
        <details v-if="content.type === 'collapsible_component' && typeof content.segment === 'object' && (content.segment.title || content.segment.segment)"
          class="whitespace-pre-wrap !mb-1 p-0 text-sm leading-tight text-blue-900 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-50"
          :open="!content.isCollapsed">
          <summary class="cursor-pointer">
            {{ content.title }}
          </summary>
          <div class="pl-4 mb-2">
            <template v-if="content.segment.type === 'text'">
              {{ content.segment.segment }}
            </template>
            <template v-else-if="content.segment.type === 'list' && Array.isArray(content.segment.segment)">
              <Markdown :source="content.segment.segment.join('\n')" />
            </template>
            <template v-else>
              <Markdown :source="content.segment.segment" />
            </template>
          </div>
        </details>

        <!-- Contenido normal -->
        <div v-else-if="content.type === 'text' && !content.temp" class="prose prose-base max-w-full dark:prose-invert">
          <Markdown :source="content.segment" />
        </div>

        <!-- Contenido con imagen -->
        <div v-else-if="content.type === 'image_url' && typeof content.segment === 'string'">
          <div class="mb-2">
            <span class="font-semibold text-gray-500">Image generated by {{ content.model }}</span>
          </div>
          <img :src="content.segment" :alt="content.model" class="w-full h-auto" />
        </div>

        <!-- Contenido con código -->
        <div v-else-if="content.type === 'code' && typeof content.segment === 'string'">
          <div class="prose prose-base max-w-full dark:prose-invert">
            <Markdown :source="'```' + content.language + '\n' + content.segment + '\n```'" />
          </div>
        </div>
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
