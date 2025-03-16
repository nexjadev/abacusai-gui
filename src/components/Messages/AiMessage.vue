<script setup lang="ts">
// import { Message } from '../../services/databaseAbacus.ts'
import { enableMarkdown } from '../../services/appConfigAbacus.ts'
import Markdown from '../Markdown.ts'
import 'highlight.js/styles/github-dark.css'
import logo from '/logo.png'
import { computed } from 'vue'
import { History } from '../../services/apiAbacus2.ts'

import { useConfig } from '../../services/appConfigAbacus.ts'
import { useChats } from '../../services/chatAbacus2.ts'

const { getRoutingDictionary, getImageDictionary } = useConfig()
const { activeModel } = useChats()

interface Segment {
  type: string
  title?: string
  counter: number
  segment: string | {
    temp: boolean
    type: string
    title: string | null
    segment: string
    isSpinny: boolean
    messageId: string | null
    isGeneratingImage: boolean
  }
  isSpinny?: boolean
  isRouting?: boolean
  messageId: string
  isCollapsed?: boolean
  isComplexSegment?: boolean
}

interface Message {
  regenerateAttempt: number
  inputParams: {
    llmName: string
    forceRoutingType: string | null
  }
  segments: Segment[]
  streamedData: string
  streamedSectionData: any[]
  llmDisplayName: string
  llmBotIcon: string
  routedLlm: string
  role: string
  timestamp: string
  messageIndex: number
  text: string
  modelVersion: string
}

type Props = {
  message: History
}

const { message } = defineProps<Props>()

const messageContent = computed(() => {
  return message.segments.map(segment => {
    if (segment.type === 'collapsible_component') {
      return {
        isComplexSegment: segment.isComplexSegment,
        isCollapsible: true,
        title: segment.title,
        content: typeof segment.segment === 'object' ? segment.segment.segment : segment.segment,
        isSpinny: segment.isSpinny
      }
    } else {
      return {
        isCollapsible: false,
        content: typeof segment.segment === 'object' ? segment.segment.segment : segment.segment,
        isSpinny: segment.isSpinny || false
      }
    }
  })
})

const thought = computed(() => {
  const end = message.text.indexOf('</think>')
  if (end != -1) {
    return [
      message.text.substring('<think>'.length, end),
      message.text.substring(end + '</think>'.length),
    ]
  } else {
    return [null, message.text]
  }
})
</script>

<template>
  <div class="flex rounded-xl max-w-5xl mx-auto px-2 py-6 dark:bg-gray-800 sm:px-4">
    <img :src="message.llmBotIcon || getImageDictionary(activeModel?.externalApplicationId || '')" :alt="message.llmDisplayName || 'AI'"
      class="mr-2 mt-7 flex size-9 aspect-square rounded-full border border-gray-200 bg-white object-contain sm:mr-4"/>
    <div class="flex flex-col rounded-xl">
      <span class="font-medium !text-[12px] ml-0.5 flex items-center gap-1 text-gray-600 dark:text-gray-400">
        {{ message.llmDisplayName || activeModel?.name }}
        <div v-if="message.routedLlm" class="flex items-center gap-1">
          <svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" /></svg>
          {{ getRoutingDictionary(message.routedLlm ?? '') }}
        </div>
      </span>
      <div v-for="(content, index) in message.segments" :key="index">
        <!-- Contenido colapsable -->
        <details v-if="content.type === 'collapsible_component' && content.segment.segment"
          class="whitespace-pre-wrap rounded-md mb-4 border border-blue-200 bg-blue-50 p-4 text-sm leading-tight text-blue-900 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-50"
          :open="!content.isCollapsed">
          <summary>
            {{ content.title }}
          </summary>
          {{ content.segment.segment }}
        </details>

        <!-- Contenido normal -->
        <div v-if="content.type === 'text' && !content.temp" class="prose prose-base max-w-full dark:prose-invert">
          <Markdown :source="content.segment" />
        </div>
      </div>
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
</style>
