import { ref } from 'vue'
import { ChatFinalResponse, ChatResponseSegment, ExternalApplication, MessageChatRequest, StreamMessage, useApi } from './apiAbacus2'
import { currentModel } from './appConfigAbacus'
import { History, SSEChatPartResponse, SSESegment } from './apiAbacus2'

const availableModels = ref<ExternalApplication[]>([])

export const useAI = () => {
  const { generateChat, listLocalModels } = useApi()

  const generate = async (
    message: MessageChatRequest,
    onMessage?: (data: ChatResponseSegment) => void,
    onDone?: (data: ChatFinalResponse) => void,
  ) => {
    await generateChat(message, (data: StreamMessage) => {
      if ('ping' in data) {
        // Ignorar mensajes de ping
        return;
      }

      if ('end' in data) {
        // Es un mensaje de finalización
        if (onDone) {
          onDone(data as ChatFinalResponse);
        }
      } else {
        // Es un mensaje de texto regular
        if (onMessage) {
          onMessage(data as ChatResponseSegment);
        }
      }
    });
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
