import { computed, ref } from 'vue'
import {
  currentModelId,
  useConfig,
  currentChatId,
  historyChatLength,
  currentExtAppId,
} from './appConfig.ts'
import { useAI } from './useAi.ts'
import {
  ChatFinalResponse,
  ChatResponseSegment,
  Conversation,
  CreateConversationRequest,
  DeleteConversationRequest,
  DetachDocumentsRequest,
  DocumentFile,
  ExternalApplication,
  History,
  MessageChatRequest,
  RenameConversationRequest,
  TitleConversationRequest,
  UploadDataConversationResponse,
  useApi,
} from './api.ts'

const chats = ref<Conversation[]>([])
const activeChat = ref<Conversation | null>(null)
const activeModel = ref<ExternalApplication | null>(null)
const messages = ref<History[]>([])
const systemPrompt = ref<History>()
const ongoingAiMessages = ref<Map<string, History>>(new Map())
const TITLE_CONVERSATION = 'New Chat'
const documentsUploaded = ref<DocumentFile[]>([])
const filesUploaded = ref<DocumentFile[]>([])

const clearUploadedFiles = () => {
  filesUploaded.value = []
  documentsUploaded.value = []
}

// Función auxiliar para determinar si un mensaje es editable
const isMessageEditable = (message: History): boolean => {
  if (message.role !== 'USER') return false
  const lastUserMessageIndex = [...messages.value]
    .reverse()
    .findIndex((m) => m.role === 'USER')
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
    detachDocumentsConversation,
    getOneDocument,
  } = useApi()

  const hasActiveChat = computed(() => activeChat.value !== null)
  const hasMessages = computed(() => messages.value.length > 0)

  const setActiveChat = (chat: Conversation) => {
    activeChat.value = chat
    currentChatId.value = chat.deploymentConversationId
    if (chat.history) {
      messages.value = chat.history
    } else {
      messages.value = []
    }
  }

  const setMessages = (newMessages: History[]) => {
    messages.value = newMessages
    if (activeChat.value) {
      activeChat.value.history = newMessages
    }
  }

  const setActiveModel = (model: ExternalApplication) => {
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
      chats.value = await getAllChats(
        currentModelId.value,
        historyChatLength.value.toString(),
      )
    } catch (error) {
      console.error('Failed to get chats:', error)
    }
  }

  const switchChat = async (deploymentConversationId: string) => {
    try {
      const chat = await getChat(deploymentConversationId)
      if (chat) {
        setActiveChat(chat)
        if (activeChat.value) {
          await switchModel(
            activeChat.value.deploymentId,
            activeChat.value.externalApplicationId,
          )
        }
        const chatExists = chats.value.some(
          (c) => c.deploymentConversationId === chat.deploymentConversationId,
        )
        if (!chatExists) {
          chats.value.unshift(chat)
        }
        clearUploadedFiles()
      }
    } catch (error) {
      console.error(`Failed to switch to chat with ID ${currentModelId.value}:`, error)
    }
  }

  const switchModel = async (deploymentId: string, externalApplicationId: string) => {
    currentModelId.value = deploymentId
    currentExtAppId.value = externalApplicationId
    try {
      const model = availableModels.value.find(
        (model) =>
          model.deploymentId === deploymentId &&
          model.externalApplicationId === externalApplicationId,
      )
      if (model) {
        setActiveModel(model)
      }
    } catch (error) {
      console.error(`Failed to switch model to ${deploymentId}:`, error)
    }
  }

  const renameChat = async (deploymentConversationId: string, newName: string) => {
    if (!activeChat.value) return

    activeChat.value.name = newName
    const request: RenameConversationRequest = {
      deploymentId: currentModelId.value,
      deploymentConversationId: deploymentConversationId,
      name: newName,
    }
    await renameConversation(request)
    await getChats()
  }

  const startNewChat = async () => {
    const chat: Conversation = {
      deploymentConversationId: '',
      name: '',
      deploymentId: '',
      createdAt: new Date(),
      externalApplicationId: '',
      conversationType: 'CHATLLM',
      metadata: {
        chatllmTeamsV2: false
      },
      hasHistory: false,
      history: []
    }

    setActiveChat(chat)
    await addSystemMessage(await useConfig().getCurrentSystemMessage())
    clearUploadedFiles()
  }

  const createNewChat = async (name: string = TITLE_CONVERSATION) => {
    const newChat: CreateConversationRequest = {
      externalApplicationId: activeModel.value?.externalApplicationId || '',
      name: name,
      deploymentId: activeModel.value?.deploymentId || '',
    }

    try {
      const newConversation = await createConversation(newChat)
      setActiveChat(newConversation)
      await addSystemMessage(await useConfig().getCurrentSystemMessage())
      clearUploadedFiles()
    } catch (error) {
      console.error('Failed to start a new chat:', error)
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

    const currentChatId = activeChat.value.deploymentConversationId!
    const message: MessageChatRequest = {
      requestId: crypto.randomUUID(),
      deploymentConversationId: currentChatId,
      message: content,
      isDesktop: true,
      chatConfig: {
        timezone: 'America/Lima',
        language: 'es-419',
      },
      externalApplicationId: activeModel.value?.externalApplicationId || '',
    }

    try {
      await startUserMessage(content, currentChatId)
      await generate(
        message,
        (data: ChatResponseSegment) => handleAiPartialResponse(data, currentChatId),
        (data: ChatFinalResponse) => handleAiCompletion(data, currentChatId),
      )
      await updateChatTitle(currentChatId, content)
      await switchChat(currentChatId)
      await getAllDocumentsUploaded()
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

    const currentChatId = activeChat.value.deploymentConversationId!
    const message: MessageChatRequest = {
      requestId: crypto.randomUUID(),
      deploymentConversationId: currentChatId,
      message: content,
      isDesktop: true,
      editPrompt: true,
      regenerate: true,
      chatConfig: {
        timezone: 'America/Lima',
        language: 'es-419',
      },
      externalApplicationId: activeModel.value?.externalApplicationId || '',
    }

    try {
      // Encontrar y actualizar el último mensaje del usuario
      const lastUserMessage = [...messages.value].reverse().find((m) => m.role === 'USER')
      if (lastUserMessage) {
        lastUserMessage.text = content
      }

      // Eliminar la última respuesta del bot
      const lastBotMessage = messages.value[messages.value.length - 1]
      if (lastBotMessage && lastBotMessage.role === 'BOT') {
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

  async function updateChatTitle(deploymentConversationId: string, userMessage: string) {
    if (activeChat.value?.name === TITLE_CONVERSATION) {
      const request: TitleConversationRequest = {
        deploymentConversationId: deploymentConversationId,
        userMessage: userMessage,
      }
      const response = await titleConversation(request)
      activeChat.value.name = response.title
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

  const deleteChat = async (deploymentId: string, deploymentConversationId: string) => {
    try {
      const request: DeleteConversationRequest = {
        deploymentId: deploymentId,
        deploymentConversationId: deploymentConversationId,
      }
      await deleteConversation(request)

      // Encontrar el índice del chat a eliminar
      const chatIndex = chats.value.findIndex(
        (chat) => chat.deploymentConversationId === deploymentConversationId,
      )
      if (chatIndex !== -1) {
        // Remover el chat de la lista
        chats.value.splice(chatIndex, 1)
      }

      await startNewChat()
    } catch (error) {
      console.error(`Failed to delete chat with ID ${deploymentConversationId}:`, error)
    }
  }

  const uploadDataChat = async (
    deploymentId: string,
    deploymentConversationId: string,
    file: File,
  ): Promise<UploadDataConversationResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('deploymentId', deploymentId)
    formData.append('deploymentConversationId', deploymentConversationId)

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
    const response = await getAllDocuments(
      activeChat.value?.deploymentConversationId ?? '',
    )
    documentsUploaded.value = response.docInfos
  }

  const getOneDocumentUploaded = async (requestId: string): Promise<DocumentFile | null> => {
    const response = await getOneDocument(requestId)
    return response.docInfos ? response.docInfos[0] : null
  }

  const detachDocuments = async (docId: string) => {
    if (!activeChat.value) {
      console.warn('There was no active chat.')
      return
    }
    const request: DetachDocumentsRequest = {
      documentUploadIds: [docId],
      deploymentConversationId: activeChat.value?.deploymentConversationId ?? '',
    }
    const response = await detachDocumentsConversation(request)
    documentsUploaded.value = response.docInfos
  }

  const startAiMessage = async (data: ChatResponseSegment, currentChatId: string) => {
    const message: History = {
      regenerateAttempt: 0,
      inputParams: {
        llmName: '',
        forceRoutingType: null,
      },
      segments: [],
      llmDisplayName: activeModel.value?.name || '',
      llmBotIcon: '',
      routedLlm: '',
      role: 'BOT',
      timestamp: new Date().toISOString(),
      messageIndex: messages.value.length + 1,
      text: '',
      modelVersion: '',
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
      const message: History = {
        regenerateAttempt: 0,
        inputParams: {
          llmName: '',
          forceRoutingType: null,
        },
        segments: [],
        llmDisplayName: '',
        llmBotIcon: '',
        routedLlm: '',
        role: 'USER',
        timestamp: new Date().toISOString(),
        messageIndex: messages.value.length + 1,
        text: content,
        modelVersion: '',
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
        if (data.type === 'collapsible_component') {
          const collapsibleComponent: ChatResponseSegment = {
            type: 'collapsible_component',
            isSpinny: data.isSpinny,
            // external: data.external,
            segment: data.segment,
            title: data.title,
            isComplexSegment: data.isComplexSegment,
            isCollapsed: data.isCollapsed,
            isRouting: data.isRouting,
            counter: data.counter,
            message_id: data.message_id,
            messageId: data.messageId,
          }
          aiMessage.segments.push(collapsibleComponent)
        } else if (data.type === 'text' && data.temp == true) {
            const textSegment: ChatResponseSegment = {
              type: 'text',
              temp: data.temp,
              isSpinny: data.isSpinny,
              segment: data.segment,
              title: data.title,
              isGeneratingImage: data.isGeneratingImage,
              counter: data.counter,
              message_id: data.message_id,
              messageId: data.messageId
            }
            aiMessage.segments.push(textSegment)
        } else if (data.type === 'text') {
          const textSegment = aiMessage.segments.find((segment) => segment.type === 'text' && !segment.temp && segment.counter)
          if (textSegment && typeof textSegment.segment === 'string') {
            textSegment.segment = textSegment.segment + data.segment
            textSegment.messageId = data.messageId
            textSegment.counter = data.counter
          } else {
            const textSegment: ChatResponseSegment = {
              type: 'text',
              segment: data.segment,
              counter: data.counter,
              message_id: data.message_id,
              messageId: data.messageId
            }
            aiMessage.segments.push(textSegment)
          }
        }
      } catch (error) {
        console.error('Failed to append to AI message:', error)
      }
    } else {
      console.log('No ongoing AI message?')
    }
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
  }
}
