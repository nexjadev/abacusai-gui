import { ref } from 'vue'
import { useApi } from './api'
import { LlmModel } from "../dtos/llm-model.dto.ts";
import { ChatFinalResponse, ChatResponseSegment, StreamMessage} from "../dtos/steam-message.dto.ts";
import { MessageChatRequest } from "../dtos/message.dto.ts";

const availableModels = ref<LlmModel[]>([])

export const useAI = () => {
  const { generateChat, listLocalModels } = useApi()

  const generate = async (
    message: MessageChatRequest,
    onMessage?: (data: ChatResponseSegment) => void,
    onDone?: (data: ChatFinalResponse) => void,
  ) => {
    await generateChat(message, (data: StreamMessage) => {
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
