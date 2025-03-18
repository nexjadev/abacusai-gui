import { ref } from 'vue'
import { baseUrl } from './appConfig.ts'

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
  hasHistory: boolean;
  history?: History[];
};

export type CreateConversationRequest = {
  name: string;
  deploymentId: string;
  externalApplicationId: string;
};

export type TitleConversationRequest = {
  deploymentConversationId: string;
  userMessage: string;
}

export type DeleteConversationRequest = {
  deploymentId: string;
  deploymentConversationId: string;
}

export type RenameConversationRequest = {
  deploymentId: string;
  deploymentConversationId: string;
  name: string;
}

export type DetachDocumentsRequest = {
  documentUploadIds: string[];
  deploymentConversationId: string;
}

export type TitleConversationResponse = {
  title: string;
}

export type UploadDataConversationResponse = {
  request_id: string;
}

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

export type History = {
  regenerateAttempt: number;
  inputParams: InputParams;
  role: 'USER' | 'BOT';
  timestamp: string;
  messageIndex: number;
  text: string;
  modelVersion: string;
  segments: ChatResponseSegment[];
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

export type ChatConfig = {
  timezone: string;
  language: string;
}

export type MessageChatRequest = {
  requestId: string;
  deploymentConversationId: string;
  message: string;
  isDesktop: boolean;
  chatConfig: ChatConfig;
  externalApplicationId: string;
  editPrompt?: boolean;
  regenerate?: boolean;
}

// Tipo base para todos los mensajes
interface BaseStreamMessage {
  counter?: number;
  messageId?: string;
  message_id?: string;
}

// Tipo para los segmentos de respuesta
export type ChatResponseSegment = {
  type: string;
  temp?: boolean;
  isSpinny?: boolean;
  segment?: string | any;
  title?: string;
  isGeneratingImage?: boolean;
  messageId: string;
  counter: number;
  message_id?: string;
  ping?: boolean;
  isRouting?: boolean;
  isCollapsed?: boolean;
  isComplexSegment?: boolean;
}

// Tipo para la respuesta final
export type ChatFinalResponse = {
  token: null;
  end: boolean;
  success: boolean;
  counter: number;
}

export type DocumentFile = {
  doc_id: string;
  filename: string;
  mime_type: string;
  uploaded_at: string;
  size: number;
  page_count: number | null;
  document_upload_id: string;
  processing_error: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  message_index: number | null;
};

export type ListFilesResponse = {
  docInfos: DocumentFile[];
  maxCount: number;
}

// Tipo unión para manejar cualquier tipo de mensaje
export type StreamMessage = ChatResponseSegment | ChatFinalResponse;

// Define a method to get the full API URL for a given path
const getApiUrl = (path: string) =>
  `${'http://3.21.99.235:8000'}${path}`

const abortController = ref<AbortController>(new AbortController())
const signal = ref<AbortSignal>(abortController.value.signal)
// Define the API client functions
export const useApi = () => {
  const error = ref(null)

  const generateChat = async (request: MessageChatRequest, onDataReceived: (data: any) => void): Promise<any[]> => {
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
    let results: StreamMessage[] = []

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        try {
          const chunk = new TextDecoder('utf-8').decode(value)
          const parts = chunk.split('\n').filter(part => part.trim() !== '');

          for (const part of parts) {
            try {
              const parsedChunk: StreamMessage = JSON.parse(part);
              onDataReceived(parsedChunk);
              results.push(parsedChunk);
            } catch (e) {
              console.log('Error al parsear parte del chunk -> ', e, 'parte -> ', part);
            }
          }
        } catch (e) {
          // Carry on...
          console.log('generateChat -> error -> ', e)
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
  const getChat = async (deploymentConversationId: string): Promise<Conversation> => {
    const queryParams = new URLSearchParams({
      deploymentConversationId,
      skipDocumentBoundingBoxes: "true",
      filterIntermediateConversationEvents: "true",
    });
    const response = await fetch(getApiUrl('/conversations/one?' + queryParams.toString()), {
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

  // createConversation
  const createConversation = async (request: CreateConversationRequest): Promise<Conversation> => {
    const response = await fetch(getApiUrl('/conversations'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<Conversation> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
    return response_request.result as Conversation
  }

  // titleConversation
  const titleConversation = async (request: TitleConversationRequest): Promise<TitleConversationResponse> => {
    const response = await fetch(getApiUrl('/conversations/title'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<TitleConversationResponse> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
    return response_request.result as TitleConversationResponse
  }

  // Delete a Conversation
  const deleteConversation = async (request: DeleteConversationRequest): Promise<void> => {
    const response = await fetch(getApiUrl('/conversations/delete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<null> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
  }

  // Rename a Conversation
  const renameConversation = async (request: RenameConversationRequest): Promise<void> => {
    const response = await fetch(getApiUrl('/conversations/rename'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<null> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
  }

  // Upload a file to a Conversation
  const uploadDataConversation = async (formData: FormData): Promise<UploadDataConversationResponse> => {
    const response = await fetch(getApiUrl('/conversations/upload-data'), {
      method: 'POST',
      body: formData,
    })
    const response_request: UploadDataConversationResponse = await response.json()
    return response_request
  }

  // Obtener lista de archivos de una conversación
  const getAllDocuments = async (deploymentConversationId: string): Promise<ListFilesResponse> => {
    const response = await fetch(getApiUrl('/conversations/files'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deploymentConversationId }),
    })
    const response_request: AbacusResponse<ListFilesResponse> = await response.json()
    return response_request.result as ListFilesResponse
  }

  // Obtener el archivo de una conversación
  const getOneDocument = async (requestId: string): Promise<ListFilesResponse> => {
    const response = await fetch(getApiUrl('/conversations/upload-status/' + requestId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const response_request: any = await response.json()
    if (response_request.status == 'SUCCESS') {
      const new_response = response_request.result as AbacusResponse<ListFilesResponse>
      return new_response.result as ListFilesResponse
    }
    throw new Error('Error al obtener el archivo de la conversación')
  }

  // desvincular documentos de una conversación
  const detachDocumentsConversation = async (request: DetachDocumentsRequest): Promise<ListFilesResponse> => {
    const response = await fetch(getApiUrl('/conversations/detach/documents'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<ListFilesResponse> = await response.json()
    console.log('response_request -> ', response_request)
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
    return response_request.result as ListFilesResponse
  }

  const abort = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = new AbortController()
      signal.value = abortController.value.signal
      console.log('Fetch request aborted and controller reset')
    }
  }

  // Construir URL para descargar un documento por su ID
  const getDocumentDownloadUrl = (docId: string): string => {
    return getApiUrl(`/conversations/documents/store?docId=${docId}&maxWidth=100&maxHeight=100`)
  }

  return {
    error,
    generateChat,
    // createModel,
    listLocalModels,
    // showModelInformation,
    // copyModel,
    // deleteModel,
    // pullModel,
    // pushModel,
    // generateEmbeddings,
    abort,
    getAllChats,
    getChat,
    createConversation,
    titleConversation,
    deleteConversation,
    renameConversation,
    uploadDataConversation,
    getAllDocuments,
    getOneDocument,
    getDocumentDownloadUrl,
    detachDocumentsConversation,
  }
}
