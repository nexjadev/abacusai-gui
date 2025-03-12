import { ref } from 'vue'
import { ExternalApplication, MessageChatRequest, StreamMessage, StreamResponse, TextMessage, useApi } from './apiAbacus2'
import { currentModel } from './appConfigAbacus'
import { History, SSEChatPartResponse, SSESegment } from './apiAbacus2'

const availableModels = ref<ExternalApplication[]>([])

export const useAI = () => {
  const { generateChat, listLocalModels } = useApi()

  const generate = async (
    message: MessageChatRequest,
    onMessage?: (data: TextMessage) => void,
    onDone?: (data: StreamResponse) => void,
  ) => {
    // let chatHistory = messages.slice(-(historyMessageLength ?? 0))
    // if (system) {
    //   chatHistory.unshift(system)
    // }
     await generateChat(message, (data: StreamMessage) => {
      // if (!data.done && onMessage) {
      //   onMessage(data as SSEChatPartResponse)
      // } else if (data.done && onDone) {
      //   onDone(data as SSESegment)
      // }
      if ('ping' in data) {
        // Es un mensaje de ping
          return;
      }

      if ('end' in data) {
          // Es un mensaje de análisis
          // onDone(data as StreamResponse);
      } else {
          // Es un mensaje de texto regular
          // onMessage(data as TextMessage);
      }
    })
  }

  const refreshModels = async () => {
    const response = await listLocalModels()
    availableModels.value = response ?? []
  }

  // Use toRefs to keep reactivity when destructuring in components.
  return {
    availableModels,
    refreshModels,
    generate,
  }
}
