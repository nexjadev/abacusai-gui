import { ref } from 'vue'
import { getApiUrl } from './appConfig';
import { getAuthHeaders, getAuthToken, handleTokenExpired } from './auth';
import { MessageChatRequest } from '../dtos/message.dto';
import {StreamMessage} from "../dtos/steam-message.dto.ts";
import {LlmModel} from "../dtos/llm-model.dto.ts";
import {Conversation, CreateConversationRequest, RenameConversationRequest, TitleConversationRequest} from "../dtos/conversation.dto.ts";


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


export type DeleteConversationRequest = {
  deploymentId: string;
  deploymentConversationId: string;
}


export type DetachDocumentsRequest = {
  documentUploadIds: string[];
  deploymentConversationId: string;
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

// Tipo base para todos los mensajes
interface BaseStreamMessage {
  counter?: number;
  messageId?: string;
  message_id?: string;
}

export type ChatResponseSubSegment = {
  type: string;
  message_id: string;
  segment: string | string[];
  id: string;
  temp: boolean;
  is_spinny: boolean;
  title: string;
  is_generating_image: boolean;
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

export type AttachDocumentsRequest = {
  deploymentConversationId: string;
  documentUploadIds: string[];
}

const abortController = ref<AbortController>(new AbortController())
const signal = ref<AbortSignal>(abortController.value.signal)

// Función para hacer una petición con manejo de token expirado
const fetchWithTokenRefresh = async (url: string, options: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, options)

    if (response.status === 401 || response.status === 403) {
      // Token expirado, intentar refrescar
      const newToken = await handleTokenExpired()

      // Reintentar la petición con el nuevo token
      const newHeaders = new Headers(options.headers)
      newHeaders.set('Authorization', `Bearer ${newToken}`)

      return fetch(url, {
        ...options,
        headers: newHeaders
      })
    }

    return response
  } catch (error) {
    throw error
  }
}

function extractData(text: string) {
  // Expresión regular que busca texto que comience con 'data: ' y termine en '}\n\n'
  const regex = /data: (.*?})\n\n/g;
  const results = [];

  // Encuentra todas las coincidencias
  let match;
  while ((match = regex.exec(text)) !== null) {
      // Agrega solo el grupo capturado (sin 'data: ' y sin '\n\n')
      results.push(match[1]);
  }

  return results;
}

// Define the API client functions
export const useApi = () => {
  const error = ref(null)

  const generateChat = async (request: MessageChatRequest, onDataReceived: (data: any) => void): Promise<any[]> => {
    const res = await fetchWithTokenRefresh(getApiUrl('/conversations/response'), {
      method: 'POST',
      headers: getAuthHeaders(),
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
          const parts = extractData(chunk);

          for (const part of parts) {
            try {
              const parsedChunk: StreamMessage = JSON.parse(part);
              onDataReceived(parsedChunk);
              results.push(parsedChunk);
              await new Promise(resolve => setTimeout(resolve, 20)); // Espera 10ms antes de continuar
            } catch (e) {
              console.error('Error al parsear parte del chunk');
              console.error('exception -> ', e)
              console.error('chunk -> ', chunk)
              console.error('')
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

  // List local models
  const listLocalModels = async (): Promise<LlmModel[]> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/llm/models'), {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const listLocalModels: AbacusResponse<LlmModel> = await response.json()
    if (!listLocalModels.success) {
      throw new Error(listLocalModels.error)
    }
    return listLocalModels.result as LlmModel[]
  }

  // Show model information


  // Copy a model


  // Delete a model


  // Pull a model


  // Push a model


  // Generate embeddings

  // getAllChats
  const getAllChats = async (user_id: string, limit: string): Promise<Conversation[]> => {
    const queryParams = new URLSearchParams({
      user_id: user_id,
      limit: limit
    });
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations?' + queryParams.toString()), {
      method: 'GET',
      headers: getAuthHeaders()
    })
    const allChats: AbacusResponse<Conversation> = await response.json()
    if (!allChats.success) {
      throw new Error(allChats.error)
    }
    return allChats.result as Conversation[]
  }

  // getChat
  const getChat = async (conversation_id: string, user_id: string): Promise<Conversation> => {
    const queryParams = new URLSearchParams({
      conversation_id: conversation_id,
      user_id: user_id,
    });
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/one?' + queryParams.toString()), {
      method: 'GET',
      headers: getAuthHeaders()
    })
    const chat: AbacusResponse<Conversation> = await response.json()
    if (!chat.success) {
      throw new Error(chat.error)
    }
    return chat.result as Conversation
  }

  // createConversation
  const createConversation = async (request: CreateConversationRequest): Promise<Conversation> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<Conversation> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
    return response_request.result as Conversation
  }

  // titleConversation
  const titleConversation = async (request: TitleConversationRequest): Promise<void> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/title'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<null> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
  }

  // Delete a Conversation
  const deleteConversation = async (request: DeleteConversationRequest): Promise<void> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/delete'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<null> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
  }

  // Rename a Conversation
  const renameConversation = async (request: RenameConversationRequest): Promise<void> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/rename'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<null> = await response.json()
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
  }

  // Upload a file to a Conversation
  const uploadDataConversation = async (formData: FormData): Promise<UploadDataConversationResponse> => {
    const headers = getAuthHeaders()
    headers.delete('Content-Type');

    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/upload-data'), {
      method: 'POST',
      headers,
      body: formData,
    })
    const response_request: UploadDataConversationResponse = await response.json()
    return response_request
  }

  // Obtener lista de archivos de una conversación
  const getAllDocuments = async (deploymentConversationId: string): Promise<ListFilesResponse> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/files'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ deploymentConversationId }),
    })
    const response_request: AbacusResponse<ListFilesResponse> = await response.json()
    return response_request.result as ListFilesResponse
  }

  // Obtener el archivo de una conversación
  const getOneDocument = async (requestId: string): Promise<ListFilesResponse> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/upload-status/' + requestId), {
      method: 'GET',
      headers: getAuthHeaders(),
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
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/detach/documents'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<ListFilesResponse> = await response.json()
    console.log('response_request -> ', response_request)
    if (!response_request.success) {
      throw new Error(response_request.error)
    }
    return response_request.result as ListFilesResponse
  }

  // adjuntar documentos a una conversación
  const attachDocumentsToConversation = async (request: AttachDocumentsRequest): Promise<ListFilesResponse> => {
    const response = await fetchWithTokenRefresh(getApiUrl('/conversations/attach-documents'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })
    const response_request: AbacusResponse<ListFilesResponse> = await response.json()
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
    listLocalModels,
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
    attachDocumentsToConversation,
  }
}
