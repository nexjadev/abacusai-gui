import { ref } from 'vue'
import { historyChatLength } from '../services/appConfig'

export function useInfiniteScroll() {
  const isLoadingMoreChats = ref(false)

  const incrementHistoryLength = async (callback?: () => Promise<void>) => {
    if (isLoadingMoreChats.value) return

    isLoadingMoreChats.value = true
    try {
      historyChatLength.value += 30
      if (callback) {
        await callback()
      }
    } finally {
      isLoadingMoreChats.value = false
    }
  }

  const handleChatScroll = async (event: Event, loadChatsCallback: () => Promise<void>) => {
    const element = event.target as HTMLElement
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1

    if (isAtBottom && !isLoadingMoreChats.value) {
      await incrementHistoryLength(loadChatsCallback)
    }
  }

  return {
    isLoadingMoreChats,
    incrementHistoryLength,
    handleChatScroll
  }
}
