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
  <div class="flex rounded-xl bg-gray-100 px-2 py-6 dark:bg-gray-800 sm:px-4">
    <img class="mr-2 flex size-10 aspect-square rounded-full border border-gray-200 bg-white object-contain sm:mr-4"
      :src="message.llmBotIcon || logo" :alt="message.llmDisplayName || 'AI'" />

    <div class="flex max-w-3xl flex-col rounded-xl">
      <div v-for="(content, index) in messageContent" :key="index">
        <!-- Contenido colapsable -->
        <span v-if="content.isComplexSegment" class="flex items-center gap-1">
          {{ message.llmDisplayName }}
          <div class="inline-flex items-center gap-1">
            <div>{{ content.title }}</div>
          </div>
        </span>
        <details v-else-if="content.isCollapsible"
          class="whitespace-pre-wrap rounded-md mb-4 border border-blue-200 bg-blue-50 p-4 text-sm leading-tight text-blue-900 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-50"
          :open="true">
          <summary v-if="content.title">
            <Markdown :source="content.title" />
          </summary>
          <div v-if="content.isSpinny" class="animate-spin">⌛</div>
          <div v-else>
            <Markdown :source="content.content" />
          </div>
        </details>

        <!-- Contenido normal -->
        <div v-else class="prose prose-base max-w-full dark:prose-invert">
          <div v-if="content.isSpinny" class="animate-spin">⌛</div>
          <div v-else>
            <Markdown :source="content.content" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
