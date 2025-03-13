<script setup lang="ts">
// import { Message } from '../../services/database.ts'
import { avatarUrl, enableMarkdown } from '../../services/appConfigAbacus.ts'
import Markdown from '../Markdown.ts'
import { History } from '../../services/apiAbacus2.ts'

type Props = {
  message: History
}

const { message } = defineProps<Props>()
</script>

<template>
  <div class="flex justify-end max-w-7xl mx-auto">
    <div class="rounded-xl bg-gray-100 my-2 px-2 py-4 sm:px-4 flex flex-row">
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
      <img v-if="avatarUrl" class="mr-2 flex size-10 rounded-full sm:mr-4" :src="avatarUrl" />
      <div
        v-else
        class="mr-2 flex size-10 aspect-square items-center justify-center rounded-full bg-white text-center text-2xl dark:bg-gray-600 sm:mr-4"
      >
      </div>
    </div>
  </div>
</template>
