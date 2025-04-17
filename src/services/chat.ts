import { computed, ref } from 'vue'
import {
  currentModelId,
  useConfig,
  currentChatId,
  historyChatLength,
  currentUserId,
} from './appConfig.ts'
import { useAI } from './useAi.ts'
import {
  useApi,
} from './api.ts'
import { LlmModel } from "../dtos/llm-model.dto.ts";
import { Conversation, CreateConversationRequest, DeleteConversationRequest, RenameConversationRequest, TitleConversationRequest } from "../dtos/conversation.dto.ts";
import { Message, MessageChatRequest } from "../dtos/message.dto.ts";
import { ChatFinalResponse, ChatResponseSegment } from "../dtos/steam-message.dto.ts";
import { AttachDocumentsRequest, DetachDocumentsRequest, DocumentResponse } from '../dtos/document.dto.ts';

const chats = ref<Conversation[]>([])
const activeChat = ref<Conversation | null>(null)
const activeModel = ref<LlmModel | null>(null)
const messages = ref<Message[]>([])
const systemPrompt = ref<Message>()
const ongoingAiMessages = ref<Map<string, Message>>(new Map())
const TITLE_CONVERSATION = 'New Chat'
const documentsUploaded = ref<DocumentResponse[]>([])
const filesUploaded = ref<DocumentResponse[]>([])
const isWebSearchActive = ref<boolean>(false)
const forceRoutingAction = ref<boolean>(false)

// Función auxiliar para determinar si un mensaje es editable
const isMessageEditable = (message: Message): boolean => {
  if (message.role !== 'user') return false
  const lastUserMessageIndex = [...messages.value]
    .reverse()
    .findIndex((m) => m.role === 'user')
  return lastUserMessageIndex === 0
}

export function useChats() {
  const { generate, availableModels } = useAI()
  const {
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
    detachDocumentsConversation,
    attachDocumentsToConversation,
  } = useApi()

  const hasActiveChat = computed(() => activeChat.value !== null)
  const hasMessages = computed(() => messages.value.length > 0)

  const setActiveChat = (chat: Conversation) => {
    activeChat.value = chat
    currentChatId.value = chat.id
    if (chat.messages) {
      messages.value = chat.messages
    } else {
      messages.value = []
    }
  }

  const setMessages = (newMessages: Message[]) => {
    messages.value = newMessages
    if (activeChat.value) {
      activeChat.value.messages = newMessages
    }
  }

  const setActiveModel = (model: LlmModel) => {
    activeModel.value = model
  }

  const initialize = async () => {
    try {
      await getChats()
      if (chats.value.length == 0) {
        await createNewChat()
      }
      if (currentChatId.value) {
        await switchChat(currentChatId.value)
        await getAllDocumentsUploaded()
      }
    } catch (error) {
      console.error('Failed to initialize chats:', error)
    }
  }

  const getChats = async () => {
    try {
      chats.value = await getAllChats(currentUserId.value, historyChatLength.value.toString(),)
    } catch (error) {
      console.error('Failed to get chats:', error)
    }
  }

  const switchChat = async (conversationId: string) => {
    try {
      const chat = await getChat(conversationId, currentUserId.value)
      if (chat) {
        setActiveChat(chat)
        if (activeChat.value) {
          await switchModel(activeChat.value.llm_model_id)
        }
        // Si no encuentra el chat este se añade al comienzo
        const chatExists = chats.value.some((c) => c.id === chat.id)
        if (!chatExists) {
          chats.value.unshift(chat)
        }
        // Recorrer los mensajes del historial del chat
        if (chat.messages && chat.messages.length > 0) {
          for (const message of chat.messages) {
            // if (message.role === 'user' && message.inputParams?.forceRoutingType) {
            //   forceRoutingAction.value = true
            //   break
            // }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to switch to chat with ID ${currentModelId.value}:`, error)
    }
  }

  const switchModel = async (llmModelId: string) => {
    currentModelId.value = llmModelId
    try {
      const model = availableModels.value.find((model) => model.id == llmModelId)
      if (model) {
        setActiveModel(model)
      }
    } catch (error) {
      console.error(`Failed to switch model to ${llmModelId}:`, error)
    }
  }

  const renameChat = async (conversationId: string, newTitle: string) => {
    if (!activeChat.value) return

    activeChat.value.title = newTitle
    const request: RenameConversationRequest = {
      conversation_id: conversationId,
      user_id: currentUserId.value,
      new_title: newTitle,
    }
    await renameConversation(request)
    await getChats()
  }

  const startNewChat = async () => {
    const chat: Conversation = {
      id: '',
      user_id: currentUserId.value,
      title: TITLE_CONVERSATION,
      llm_model_id: activeModel.value?.id || '',
      system_prompt_id: '',
      messages: [],
      created_at: new Date(),
      updated_at: new Date(),
    }

    setActiveChat(chat)
    await addSystemMessage(await useConfig().getCurrentSystemMessage())
    filesUploaded.value = []
    documentsUploaded.value = []
  }

  const createNewChat = async (name: string = TITLE_CONVERSATION) => {
    const newChat: CreateConversationRequest = {
      llm_model_id: currentModelId.value,
      title: name,
      user_id: currentUserId.value,
      system_prompt_id: null,
    }

    try {
      const newConversation = await createConversation(newChat)
      setActiveChat(newConversation)
      await addSystemMessage(await useConfig().getCurrentSystemMessage())
      // filesUploaded.value = []
      // documentsUploaded.value = []
    } catch (error) {
      console.error('Failed to craete a new chat:', error)
    }
  }

  const addSystemMessage = async (content: string | null, meta?: any) => {
    if (!activeChat.value) return
    if (!content) return

    // const systemPromptMessage: Message = {
    //   chatId: activeChat.value.id!,
    //   role: 'system',
    //   content,
    //   meta,
    //   createdAt: new Date(),
    // }

    // systemPromptMessage.id = await dbLayer.addMessage(systemPromptMessage)
    // messages.value.push(systemPromptMessage)

    // systemPrompt.value = systemPromptMessage
  }

  const addUserMessage = async (content: string) => {
    if (!activeChat.value) {
      console.warn('There was no active chat.')
      return
    }

    const currentChatId = activeChat.value.id!
    const message: MessageChatRequest = {
      conversation_id: currentChatId,
      message: content,
      user_id: currentUserId.value,
      llm_model_id: currentModelId.value,
    }
    if (filesUploaded.value.length > 0) {
      message.document_ids = filesUploaded.value.map((file) => file.id)
    }

    // if (isWebSearchActive.value) {
    //   message.forceRoutingAction = 'WEB_SEARCH'
    // }

    try {
      await startUserMessage(content, currentChatId)
      await generate(
        message,
        (data: ChatResponseSegment) => handleAiPartialResponse(data, currentChatId),
        (data: ChatFinalResponse) => handleAiCompletion(data, currentChatId),
      )
      if (messages.value.length <= 2) {
        await updateChatTitle(currentChatId, content)
      }
      await switchChat(currentChatId)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // ongoingAiMessages.value.delete(currentChatId)
          return
        }
      }

      console.error('Failed to add user message:', error)
    }
  }

  const editUserMessage = async (content: string) => {
    if (!activeChat.value) {
      console.warn('There was no active chat.')
      return
    }

    const currentChatId = activeChat.value.id!
    const message: MessageChatRequest = {
      conversation_id: currentChatId,
      message: content,
      user_id: currentUserId.value,
      llm_model_id: currentModelId.value,
      // editPrompt: true,
      // regenerate: true,
    }

    try {
      // Encontrar y actualizar el último mensaje del usuario
      const lastUserMessage = [...messages.value].reverse().find((m) => m.role === 'user')
      if (lastUserMessage) {
        lastUserMessage.content = content
      }

      // Eliminar la última respuesta del bot
      const lastBotMessage = messages.value[messages.value.length - 1]
      if (lastBotMessage && lastBotMessage.role === 'assistant') {
        messages.value.splice(messages.value.length - 1, 1)
      }

      await generate(
        message,
        (data: ChatResponseSegment) => handleAiPartialResponse(data, currentChatId),
        (data: ChatFinalResponse) => handleAiCompletion(data, currentChatId),
      )
      await updateChatTitle(currentChatId, content)
      await switchChat(currentChatId)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return
        }
      }
      console.error('Failed to edit user message:', error)
    }
  }

  const handleAiPartialResponse = (data: ChatResponseSegment, currentChatId: string) => {
    ongoingAiMessages.value.has(currentChatId)
      ? appendToAiMessage(data, currentChatId)
      : startAiMessage(data, currentChatId)
  }

  const handleAiCompletion = async (data: ChatFinalResponse, currentChatId: string) => {
    const aiMessage = ongoingAiMessages.value.get(currentChatId)
    if (aiMessage) {
      try {
        ongoingAiMessages.value.delete(currentChatId)
      } catch (error) {
        console.error('Failed to finalize AI message:', error)
      }
    } else {
      console.error('no ongoing message to finalize:')
      debugger
    }
  }

  async function updateChatTitle(conversationId: string, userMessage: string) {
    const request: TitleConversationRequest = {
      conversation_id: conversationId,
      user_id: currentUserId.value,
      user_message: userMessage
    }
    await titleConversation(request)
    const chat = await getChat(conversationId, currentUserId.value)
    if (chat) {
      setActiveChat(chat)
    }
  }

  const wipeDatabase = async () => {
    try {
      // await dbLayer.clearChats()
      // await dbLayer.clearMessages()

      // Reset local state
      // chats.value = []
      // activeChat.value = null
      // messages.value = []
      // ongoingAiMessages.value.clear()

      await createNewChat()
    } catch (error) {
      console.error('Failed to wipe the database:', error)
    }
  }

  const deleteChat = async (conversationId: string) => {
    try {
      const request: DeleteConversationRequest = {
        conversation_id: conversationId,
        user_id: currentUserId.value,
      }
      await deleteConversation(request)

      // Encontrar el índice del chat a eliminar
      const chatIndex = chats.value.findIndex(
        (chat) => chat.id == conversationId,
      )
      if (chatIndex !== -1) {
        // Remover el chat de la lista
        chats.value.splice(chatIndex, 1)
      }

      await startNewChat()
    } catch (error) {
      console.error(`Failed to delete chat with ID ${conversationId}:`, error)
    }
  }

  const uploadDataChat = async (llmModelId: string, conversationId: string, file: File): Promise<DocumentResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await uploadDataConversation(formData)
      return response
    } catch (error) {
      console.error('Error al subir el archivo:', error)
      throw error
    }
  }

  const getAllDocumentsUploaded = async () => {
    if (!activeChat.value) {
      console.warn('There was no active chat.')
      return
    }
    documentsUploaded.value = await getAllDocuments(activeChat.value.id)
  }

  const getOneDocumentUploaded = async (documentId: string): Promise<DocumentResponse | null> => {
    return await getOneDocument(documentId)
  }

  const detachDocuments = async (docId: string) => {
    if (!activeChat.value) {
      console.warn('There was no active chat.')
      return
    }
    const request: DetachDocumentsRequest = {
      conversation_id: activeChat.value?.id ?? '',
      document_ids: [docId],
    }
    documentsUploaded.value = await detachDocumentsConversation(request)
  }

  const startAiMessage = async (data: ChatResponseSegment, currentChatId: string) => {
    const message: Message = {
      id: '',
      content: '',
      role: 'assistant',
      conversation_id: activeChat.value?.id || '',
      llm_model_id: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    // const collapsibleComponent: ChatResponseSegment = {
    //   type: 'collapsible_component',
    //   title: '',
    //   counter: 0,
    //   segment: {
    //     temp: false,
    //     type: 'text',
    //     title: '',
    //     segment: '',
    //     // isSpinny: false,
    //     // messageId: null,
    //     // isGeneratingImage: false,
    //     message_id: '',
    //     id: '',
    //     is_spinny: false,
    //     is_generating_image: false,
    //   },
    //   isSpinny: true,
    //   isRouting: false,
    //   messageId: '',
    //   isCollapsed: false,
    //   isComplexSegment: true,
    // }
    // message.segments.push(collapsibleComponent)
    // const textSegment: ChatResponseSegment = {
    //   type: 'text',
    //   segment: '',
    //   messageId: '',
    //   counter: 0,
    // }
    // message.segments.push(textSegment)

    try {
      ongoingAiMessages.value.set(currentChatId, message)
      messages.value.push(message)
      appendToAiMessage(data, currentChatId)
      // console.log('startAiMessage -> messages -> ', messages.value)
    } catch (error) {
      console.error('Failed to start AI message:', error)
    }
  }

  const startUserMessage = async (content: string, currentChatId: string) => {
    try {
      const message: Message = {
        id: '',
        content: content,
        role: 'user',
        conversation_id: activeChat.value?.id || '',
        llm_model_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      messages.value.push(message)
    } catch (error) {
      console.error('Failed to start USER message:', error)
    }
  }

  const appendToAiMessage = async (data: ChatResponseSegment, currentChatId: string) => {
    const aiMessage = ongoingAiMessages.value.get(currentChatId)
    if (aiMessage) {
      try {
        // aiMessage.message_id = ''
        aiMessage.content += data.content
        aiMessage.role = "assistant"
        // aiMessage.conversation_id
        // aiMessage.createdAt: Date
        // aiMessage.updatedAt: Date
      } catch (error) {
        console.error('Failed to append to AI message:', error)
      }
    } else {
      console.log('No ongoing AI message?')
    }
  }

  const attachDocuments = async () => {
    if (!activeChat.value) {
      console.warn('There was no active chat.')
      return
    }
    if (!filesUploaded.value || filesUploaded.value.length === 0) {
      console.warn('No hay documentos a adjuntar')
      return
    }

    const documentIds = filesUploaded.value
      .filter(file => file && file.id) // Aseguramos que solo incluimos archivos con id
      .map(file => file.id)

    if (documentIds.length === 0) {
      console.warn('No se encontraron IDs válidos en los archivos subidos')
      return
    }

    const request: AttachDocumentsRequest = {
      conversation_id: activeChat.value.id,
      document_ids: documentIds,
    }

    await attachDocumentsToConversation(request)
  }

  return {
    chats,
    // sortedChats,
    activeChat,
    activeModel,
    messages,
    hasMessages,
    hasActiveChat,
    documentsUploaded,
    filesUploaded,
    isWebSearchActive,
    forceRoutingAction,
    renameChat,
    switchModel,
    createNewChat,
    startNewChat,
    switchChat,
    deleteChat,
    addUserMessage,
    editUserMessage,
    addSystemMessage,
    initialize,
    wipeDatabase,
    abort,
    getChats,
    // exportChats,
    // importChats,
    uploadDataChat,
    getAllDocumentsUploaded,
    getOneDocumentUploaded,
    detachDocuments,
    attachDocuments,
  }
}
