import { computed, ref } from 'vue'
import { Chat, db, Message } from './database.ts'
import { historyMessageLength, currentModel, useConfig } from './appConfig.ts'
import { useAI } from './useAbacus.ts'
import { HistoryMessage, Conversation, DeploymentConversationListItem, useApi } from './apiAbacusai.ts'

const chats = ref<Conversation[]>([])
const activeChat = ref<Conversation | null>(null)
const messages = ref<HistoryMessage[]>([])
const systemPrompt = ref<HistoryMessage>()
const ongoingAiMessages = ref<Map<number, HistoryMessage>>(new Map())

const dbLayer = {
    async getAllChats() {
        return db.chats.toArray()
    },

    async getChat(chatId: number) {
        return db.chats.get(chatId)
    },

    async getMessages(chatId: number) {
        return db.messages.where('chatId').equals(chatId).toArray()
    },

    async addChat(chat: Chat) {
        return db.chats.add(chat)
    },

    async updateChat(chatId: number, updates: Partial<Conversation>) {
        return db.chats.update(chatId, updates)
    },

    async addMessage(message: Message) {
        return db.messages.add(message)
    },

    async updateMessage(messageId: number, updates: Partial<Message>) {
        return db.messages.update(messageId, updates)
    },

    async deleteChat(chatId: number) {
        return db.chats.delete(chatId)
    },

    async deleteMessagesOfChat(chatId: number) {
        return db.messages.where('chatId').equals(chatId).delete()
    },

    async deleteMessage(messageId: number) {
        return db.messages.delete(messageId)
    },

    async clearChats() {
        return db.chats.clear()
    },

    async clearMessages() {
        return db.messages.clear()
    },
}

export function useChats() {
    const { } = useAI()
    const { listChats } = useApi()

    const initialize = async () => {
        try {
            chats.value = await listChats(currentModel.value, '30')
            //   if (chats.value.length > 0) {
            //     await switchChat(sortedChats.value[0].id!)
            //   } else {
            //     await startNewChat('New chat')
            //   }
        } catch (error) {
            console.error('Failed to initialize chats:', error)
        }
    }


    const switchChat = async (chatId: number) => {
        // try {
        //   const chat = await dbLayer.getChat(chatId)
        //   if (chat) {
        //     setActiveChat(chat)
        //     const chatMessages = await dbLayer.getMessages(chatId)
        //     setMessages(chatMessages)
        //     if (activeChat.value) {
        //       await switchModel(activeChat.value.model)
        //     }
        //   }
        // } catch (error) {
        //   console.error(`Failed to switch to chat with ID ${chatId}:`, error)
        // }
    }

    const switchModel = async (deploymentId: string) => {
        currentModel.value = deploymentId
        if (!activeChat.value) return

        try {
            // await dbLayer.updateChat(activeChat.value.deploymentId!, { model })
            activeChat.value.deploymentId = deploymentId
        } catch (error) {
            console.error(`Failed to switch model to ${deploymentId}:`, error)
        }
    }

    const renameChat = async (newName: string) => {
        // if (!activeChat.value) return

        // activeChat.value.name = newName
        // await dbLayer.updateChat(activeChat.value.id!, { name: newName })
        // chats.value = await dbLayer.getAllChats()
    }

    const startNewChat = async (name: string) => {
        // const newChat: Chat = {
        //   name,
        //   model: currentModel.value,
        //   createdAt: new Date(),
        // }

        // try {
        //   newChat.id = await dbLayer.addChat(newChat)
        //   chats.value.push(newChat)
        //   setActiveChat(newChat)
        //   setMessages([])
        //   await addSystemMessage(await useConfig().getCurrentSystemMessage())
        // } catch (error) {
        //   console.error('Failed to start a new chat:', error)
        // }
    }


    const deleteChat = async (deploymentConversationId: string) => {
        try {

        } catch (error) {
            console.error(`Failed to delete chat with ID ${deploymentConversationId}:`, error)
        }
    }

    return {
        chats,
        activeChat,
        messages,
        initialize,
        switchChat,
        switchModel,
        renameChat,
        startNewChat,
        deleteChat,
    }
}
