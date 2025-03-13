<script setup lang="ts">
// import { Message } from '../../services/databaseAbacus.ts'
import { enableMarkdown } from '../../services/appConfigAbacus.ts'
import Markdown from '../Markdown.ts'
import 'highlight.js/styles/github-dark.css'
import logo from '/logo.png'
import { computed } from 'vue'
import { History } from '../../services/apiAbacus2.ts'

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
  <div class="flex rounded-xl max-w-7xl mx-auto px-2 py-6 dark:bg-gray-800 sm:px-4">
    <img class="mr-2 flex size-10 aspect-square rounded-full border border-gray-200 bg-white object-contain sm:mr-4"
      :src="message.llmBotIcon || logo" :alt="message.llmDisplayName || 'AI'" />

    <div class="flex flex-col rounded-xl">
      <div v-for="(content, index) in message.segments" :key="index">
        <!-- Contenido colapsable -->
        <span v-if="content.type === 'collapsible_component' && !content.isCollapsed" class="font-medium !text-[12px] ml-0.5 flex items-center gap-1">
          {{ message.llmDisplayName }}
          <div class="inline-flex items-center gap-1">
            <div>{{ content.title }}</div>
          </div>
        </span>
        <!-- <details v-if="content.type === 'collapsible_component' && content.isCollapsed"
          class="whitespace-pre-wrap rounded-md mb-4 border border-blue-200 bg-blue-50 p-4 text-sm leading-tight text-blue-900 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-50"
          :open="true">
          <summary v-if="content.title">
            <Markdown :source="content.title" />
          </summary>
          <div v-if="content.isSpinny" class="animate-spin">⌛</div>
          <div v-else>
            <Markdown :source="content.segment" />
          </div>
        </details> -->

        <!-- Contenido normal -->
        <div v-if="content.type === 'text' || content.type === 'image'" class="prose prose-base max-w-full dark:prose-invert">
          <div v-if="content.isSpinny" class="animate-spin">⌛</div>
          <div v-else>
            <Markdown :source="content.segment" />
          </div>
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
