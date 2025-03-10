import { ref } from 'vue'
import { baseUrl } from './appConfig.ts'

export type ConversationRequest = {
  requestId: string;
  deploymentConversationId: string;
  message: string;
  isDesktop: boolean;
  chatConfig: {
    timezone: string;
    language: string;
  };
  externalApplicationId: string;
}
export type SSESegment = {
  type: string;
  segment?: string;
  temp?: boolean;
  is_spinny?: boolean;
  title?: string | null;
  is_generating_image?: boolean;
  message_id?: string | null;
}

export type SSEChatPartResponse = {
  type: string;
  isSpinny?: boolean;
  segment?: SSESegment;
  title?: string;
  isComplexSegment?: boolean;
  isCollapsed?: boolean;
  isRouting?: boolean;
  counter: number;
  message_id: string;
  messageId: string;
}

export type ExternalApplication = {
  name: string;
  externalApplicationId: string;
  deploymentId: string;
  description: string;
  isAgent: number;
  predictionOverrides?: Record<string, any>;
  isSystemCreated: number;
  isCustomizable: boolean;
  isVisible: boolean;
  hasThinkingOption: boolean;
  status: string;
  isExpensive?: boolean;
}


export type Conversation = {
  deploymentConversationId: string;
  name: string;
  deploymentId: string;
  createdAt: Date;
  externalApplicationId: string;
  conversationType: 'CHATLLM';
  metadata: {
    chatllmTeamsV2: boolean;
  };
};

export type CreateConversationRequest = Omit<Conversation, 'deploymentConversationId' | 'createdAt' | 'conversationType' | 'metadata'> & {
  name: string;
  deploymentId: string;
  externalApplicationId: string;
};


type InputParams = {
  llmName: string | null;
  forceRoutingType: null;
};

type Segment = {
  type: string;
  title?: string;
  counter: number;
  segment: string | {
    temp: boolean;
    type: string;
    title: null;
    segment: string;
    isSpinny: boolean;
    messageId: null;
    isGeneratingImage: boolean;
  };
  isSpinny?: boolean;
  isRouting?: boolean;
  messageId: string;
  isCollapsed?: boolean;
  isComplexSegment?: boolean;
};

type SearchResult = {
  score: null;
  answer: string;
  source: string;
  image_ids: null;
};

type SearchResults = {
  msg_id: number;
  results: SearchResult[];
  is_docstore_id: null;
};

type DocInfo = {
  size: number;
  docId: string;
  filename: string;
  metadata: Record<string, unknown>;
  mimeType: string;
  uploadedAt: string;
  documentUploadId: string;
};

export type Message = {
  regenerateAttempt: number;
  inputParams: InputParams;
  role: 'USER' | 'BOT';
  timestamp: string;
  messageIndex: number;
  text: string;
  modelVersion: string;
  segments: Segment[];
  searchResults?: SearchResults;
  streamedData?: string;
  streamedSectionData?: any[];
  llmDisplayName?: string;
  llmBotIcon?: string;
  routedLlm?: string;
  docInfos?: DocInfo[];
};

export type AbacusResponse<T> = {
  success: boolean;
  result: T[] | T;
  error?: string;
  errorType?: string;
};

// Define a method to get the full API URL for a given path
const getApiUrl = (path: string) =>
  `${'http://3.21.99.235:8000'}${path}`

const abortController = ref<AbortController>(new AbortController())
const signal = ref<AbortSignal>(abortController.value.signal)
// Define the API client functions
export const useApi = () => {
  const error = ref(null)

  const generateChat = async (request: ConversationRequest, onDataReceived: (data: any) => void): Promise<any[]> => {
    const res = await fetch(getApiUrl('/conversations/send-message-sse'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: signal.value,
    })

    if (!res.ok) {
      throw new Error('Network response was not ok')
    }

    const reader = res.body?.getReader()
    let results: SSEChatPartResponse[] = []

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        try {
          const chunk = new TextDecoder().decode(value)
          const parsedChunk: SSEChatPartResponse = JSON.parse(chunk)

          onDataReceived(parsedChunk)
          results.push(parsedChunk)
        } catch (e) {
          // Carry on...
        }
      }
    }

    return results
  }

  // Create a model

  // List local models
  const listLocalModels = async (): Promise<ExternalApplication[]> => {
    const response = await fetch(getApiUrl('/applications/list'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const listLocalModels: AbacusResponse<ExternalApplication> = await response.json()
    if (!listLocalModels.success) {
      throw new Error(listLocalModels.error)
    }
    return listLocalModels.result as ExternalApplication[]
  }

  // Show model information


  // Copy a model


  // Delete a model


  // Pull a model


  // Push a model


  // Generate embeddings

  // getAllChats
  const getAllChats = async (deploymentId: string, limit: string): Promise<Conversation[]> => {
    const queryParams = new URLSearchParams({
      deploymentId,
      limit
    });
    const response = await fetch(getApiUrl('/conversations/list?' + queryParams.toString()), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    const allChats: AbacusResponse<Conversation> = await response.json()
    if (!allChats.success) {
      throw new Error(allChats.error)
    }
    return allChats.result as Conversation[]
  }

  // getChat
  const getChat = async (deploymentId: string, deploymentConversationId: string): Promise<Conversation> => {
    const queryParams = new URLSearchParams({
      deploymentId,
      deploymentConversationId,
      skipDocumentBoundingBoxes: "true",
      filterIntermediateConversationEvents: "true",
      getUnusedDocumentUploads: "true",
    });
    const response = await fetch(getApiUrl('/conversations?' + queryParams.toString()), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    const chat: AbacusResponse<Conversation> = await response.json()
    if (!chat.success) {
      throw new Error(chat.error)
    }
    return chat.result as Conversation
  }

  // updateNameChat
  const updateNameChat = async (deploymentId: string, deploymentConversationId: string, newName: string): Promise<void> => {
    const response = await fetch(getApiUrl(`/conversations/update-name`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deploymentId, deploymentConversationId, name: newName }),
    })
    const updatedChat: AbacusResponse<null> = await response.json()
    if (!updatedChat.success) {
      throw new Error(updatedChat.error)
    }
  }

  // createConversation
  const createConversation = async (request: CreateConversationRequest): Promise<Conversation> => {
    const response = await fetch(getApiUrl('/conversations'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    const createdConversation: AbacusResponse<Conversation> = await response.json()
    if (!createdConversation.success) {
      throw new Error(createdConversation.error)
    }
    return createdConversation.result as Conversation
  }

  return {
    error,
    generateChat,
    createModel,
    listLocalModels,
    showModelInformation,
    copyModel,
    deleteModel,
    pullModel,
    pushModel,
    generateEmbeddings,
    abort,
    getAllChats,
    getChat,
    updateNameChat,
    createConversation,
  }
}
