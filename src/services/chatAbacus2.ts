import { computed, ref } from 'vue'
import { db } from './databaseAbacus.ts'
import { historyMessageLength, currentModel, useConfig, currentExtApp } from './appConfigAbacus.ts'
import { useAI } from './useAbacus.ts'
import { Conversation, CreateConversationRequest, Message, useApi } from './apiAbacus2.ts'

// State
const chats = ref<Conversation[]>([])
const activeChat = ref<Conversation | null>(null)
const messages = ref<Message[]>([])
const systemPrompt = ref<Message>()
const ongoingAiMessages = ref<Map<number, Message>>(new Map())

export function useChats() {
  const { generate } = useAI()
  const { abort, getAllChats, getChat, updateNameChat, createConversation } = useApi()

  // Computed
  const hasActiveChat = computed(() => activeChat.value !== null)
  const hasMessages = computed(() => messages.value.length > 0)

  // Methods for state mutations
  const setActiveChat = (chat: Conversation) => (activeChat.value = chat)
  // const setMessages = (newMessages: Message[]) => (messages.value = newMessages)

  const initialize = async () => {
    try {
      chats.value = await getAllChats(currentModel.value, '30')
      if (chats.value.length == 0) {
        await startNewChat('New chat')
      }
    } catch (error) {
      console.error('Failed to initialize chats:', error)
    }
  }

  const switchChat = async (deploymentConversationId: string) => {
    try {
      const chat = await getChat(currentModel.value, deploymentConversationId)
      if (chat) {
        setActiveChat(chat)
        // const chatMessages = await dbLayer.getMessages(chatId)
        // setMessages(chatMessages)
        if (activeChat.value) {
          await switchModel(activeChat.value.deploymentId)
        }
      }
    } catch (error) {
      console.error(`Failed to switch to chat with ID ${currentModel.value}:`, error)
    }
  }

  const switchModel = async (deploymentId: string) => {
    currentModel.value = deploymentId
    if (!activeChat.value) return

    try {
      // await dbLayer.updateChat(activeChat.value.id!, { model })
      // activeChat.value.model = model
    } catch (error) {
      console.error(`Failed to switch model to ${deploymentId}:`, error)
    }
  }

  const renameChat = async (deploymentConversationId: string, newName: string) => {
    if (!activeChat.value) return

    activeChat.value.name = newName
    // await dbLayer.updateChat(activeChat.value.id!, { name: newName })
    // chats.value = await dbLayer.getAllChats()
    await updateNameChat(currentModel.value, deploymentConversationId, newName)
    chats.value = await getAllChats(currentModel.value, '30')
  }

  const startNewChat = async (name: string) => {
    const newChat: CreateConversationRequest = {
      externalApplicationId: currentExtApp.value,
      name: name,
      deploymentId: currentModel.value,
    }

    try {
      // newChat.id = await dbLayer.addChat(newChat)
      // chats.value.push(newChat)
      const newConversation = await createConversation(newChat)
      setActiveChat(newConversation)
      // setMessages([])
      await addSystemMessage(await useConfig().getCurrentSystemMessage())
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

    const currentChatId = activeChat.value.id!
    const message: Message = {
      chatId: activeChat.value.id!,
      role: 'user',
      content,
      createdAt: new Date(),
    }

    try {
      message.id = await dbLayer.addMessage(message)
      messages.value.push(message)

      await generate(
        currentModel.value,
        messages.value,
        systemPrompt.value,
        historyMessageLength.value,
        (data) => handleAiPartialResponse(data, currentChatId),
        (data) => handleAiCompletion(data, currentChatId),
      )
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          ongoingAiMessages.value.delete(currentChatId)
          return
        }
      }

      console.error('Failed to add user message:', error)
    }
  }

  const regenerateResponse = async () => {
    if (!activeChat.value) return
    const currentChatId = activeChat.value.id!
    const message = messages.value[messages.value.length - 1]
    if (message && message.role === 'assistant') {
      if (message.id) db.messages.delete(message.id)
      messages.value.pop()
    }
    try {
      await generate(
        currentModel.value,
        messages.value,
        systemPrompt.value,
        historyMessageLength.value,
        (data) => handleAiPartialResponse(data, currentChatId),
        (data) => handleAiCompletion(data, currentChatId),
      )
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          ongoingAiMessages.value.delete(currentChatId)
          return
        }
      }
      console.error('Failed to regenerate response:', error)
    }
  }

  const handleAiPartialResponse = (data: ChatPartResponse, chatId: number) => {
    ongoingAiMessages.value.has(chatId)
      ? appendToAiMessage(data.message.content, chatId)
      : startAiMessage(data.message.content, chatId)
  }

  const handleAiCompletion = async (data: ChatCompletedResponse, chatId: number) => {
    const aiMessage = ongoingAiMessages.value.get(chatId)
    if (aiMessage) {
      try {
        ongoingAiMessages.value.delete(chatId)
      } catch (error) {
        console.error('Failed to finalize AI message:', error)
      }
    } else {
      console.error('no ongoing message to finalize:')
      debugger
    }
  }

  const wipeDatabase = async () => {
    try {
      await dbLayer.clearChats()
      await dbLayer.clearMessages()

      // Reset local state
      chats.value = []
      activeChat.value = null
      messages.value = []
      ongoingAiMessages.value.clear()

      await startNewChat('New chat')
    } catch (error) {
      console.error('Failed to wipe the database:', error)
    }
  }

  const deleteChat = async (chatId: number) => {
    try {
      await dbLayer.deleteChat(chatId)
      await dbLayer.deleteMessagesOfChat(chatId)

      chats.value = chats.value.filter((chat) => chat.id !== chatId)

      if (activeChat.value?.id === chatId) {
        if (sortedChats.value.length) {
          await switchChat(sortedChats.value[0].id!)
        } else {
          await startNewChat('New chat')
        }
      }
    } catch (error) {
      console.error(`Failed to delete chat with ID ${chatId}:`, error)
    }
  }

  const startAiMessage = async (initialContent: string, chatId: number) => {
    const message: Message = {
      chatId: chatId,
      role: 'assistant',
      content: initialContent,
      createdAt: new Date(),
    }

    try {
      message.id = await dbLayer.addMessage(message)
      ongoingAiMessages.value.set(chatId, message)
      messages.value.push(message)
    } catch (error) {
      console.error('Failed to start AI message:', error)
    }
  }

  const appendToAiMessage = async (content: string, chatId: number) => {
    const aiMessage = ongoingAiMessages.value.get(chatId)
    if (aiMessage) {
      aiMessage.content += content
      try {
        await dbLayer.updateMessage(aiMessage.id!, { content: aiMessage.content })

        // Only "load the messages" if we are on this chat atm.
        if (chatId == activeChat.value?.id) {
          setMessages(await dbLayer.getMessages(chatId))
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
    sortedChats,
    activeChat,
    messages,
    hasMessages,
    hasActiveChat,
    renameChat,
    switchModel,
    startNewChat,
    switchChat,
    deleteChat,
    addUserMessage,
    regenerateResponse,
    addSystemMessage,
    initialize,
    wipeDatabase,
    abort,
    exportChats,
    importChats,
  }
}
