<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'
import ChatMessage from './ChatMessage.vue'
import { useChats } from '../services/chatAbacus2.ts'
import { showSystem } from '../services/appConfigAbacus.ts'

const { messages, editUserMessage } = useChats()
const chatElement = ref<HTMLElement>()
const userInterferedWithScroll = ref(false)

const isAtBottom = () => {
  if (!chatElement.value) return false

  const { scrollTop, scrollHeight, clientHeight } = chatElement.value
  return scrollHeight - scrollTop <= clientHeight + 10 // 10 is a small threshold
}

const handleUserScroll = () => {
  userInterferedWithScroll.value = !isAtBottom()
}

const handleMessageUpdate = async (updatedMessage: any) => {
  if (updatedMessage.role === 'USER') {
    await editUserMessage(updatedMessage.text)
  }
}

const scrollToBottom = () => {
  if (userInterferedWithScroll.value) return

  nextTick(() => {
    if (chatElement.value) {
      chatElement.value.scrollTop = chatElement.value.scrollHeight
    }
  })
}

onMounted(() => {
  scrollToBottom()
  chatElement.value?.addEventListener('scroll', handleUserScroll)
})

onUpdated(() => scrollToBottom())

watch(messages, () => {
  if (isAtBottom()) {
    userInterferedWithScroll.value = false
  }
})

onUnmounted(() => chatElement.value?.removeEventListener('scroll', handleUserScroll))

const visibleMessages = computed(() => {
    return messages?.value
  }
)
</script>

<template>
  <div
    ref="chatElement"
    class="flex-1 custom-scrollbar overflow-y-auto scroll-smooth rounded-xl p-4 text-sm leading-6 text-gray-900 dark:text-gray-100 sm:text-base sm:leading-7"
  >
    <div v-if="!visibleMessages?.length" class="flex h-full items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">
        Escribe un mensaje para comenzar la conversación...
      </p>
    </div>
    <ChatMessage
      v-for="message in visibleMessages"
      :message="message"
      @update-message="handleMessageUpdate"
    />
  </div>
</template>
