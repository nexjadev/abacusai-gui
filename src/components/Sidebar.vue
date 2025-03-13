<script setup lang="ts">
import {
  IconMoon,
  IconPlus,
  IconSettings2,
  IconSun,
  IconTrashX,
  IconUserCircle,
  IconMessageCode,
  IconPencil,
} from '@tabler/icons-vue'

import {
  isDarkMode,
  isSystemPromptOpen,
  toggleSettingsPanel,
  toggleSystemPromptPanel,
} from '../services/appConfigAbacus.ts'
import { useChats } from '../services/chatAbacus2.ts'
import { Conversation } from '../services/apiAbacus2.ts'
import { computed } from 'vue'

const { chats, activeChat, switchChat, deleteChat, startNewChat } = useChats()

const onNewChat = () => {
  checkSystemPromptPanel()
  return startNewChat('New chat')
}

const onSwitchChat = (deploymentConversationId: string) => {
  checkSystemPromptPanel()
  return switchChat(deploymentConversationId)
}

const checkSystemPromptPanel = () => {
  isSystemPromptOpen.value = false
}

const lang = navigator.language

// Función para agrupar chats por fecha
const groupedChats = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const threeDaysAgo = new Date(today)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const fourDaysAgo = new Date(today)
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)

  return {
    today: chats.value.filter(chat => {
      const chatDate = new Date(chat.createdAt)
      return chatDate >= today
    }),
    yesterday: chats.value.filter(chat => {
      const chatDate = new Date(chat.createdAt)
      return chatDate >= yesterday && chatDate < today
    }),
    twoDaysAgo: chats.value.filter(chat => {
      const chatDate = new Date(chat.createdAt)
      return chatDate >= twoDaysAgo && chatDate < yesterday
    }),
    threeDaysAgo: chats.value.filter(chat => {
      const chatDate = new Date(chat.createdAt)
      return chatDate >= threeDaysAgo && chatDate < twoDaysAgo
    }),
    fourDaysAgo: chats.value.filter(chat => {
      const chatDate = new Date(chat.createdAt)
      return chatDate >= fourDaysAgo && chatDate < threeDaysAgo
    })
  }
})

// Función para editar el nombre del chat
const editChat = (chat: Conversation) => {
  // Implementar lógica de edición
  console.log('Editar chat:', chat.name)
}
</script>

<template>
  <aside class="flex">
    <div
      class="flex h-screen w-60 flex-col overflow-y-auto border-r border-gray-200 bg-white pt-2 dark:border-gray-800 dark:bg-gray-900 sm:h-screen sm:w-64"
    >
      <div class="mx-2 mb-2">
        <div class="relative">
          <input
            type="text"
            placeholder="Search..."
            class="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg class="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="h-full overflow-y-auto px-2 py-1">
        <!-- TODAY -->
        <div v-if="groupedChats.today.length > 0" class="mb-4">
          <div class="mb-1 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            TODAY
          </div>
          <div class="space-y-1">
            <div
              v-for="chat in groupedChats.today"
              :key="chat.deploymentConversationId"
              @click="onSwitchChat(chat.deploymentConversationId!)"
              :class="{
                'bg-purple-100 dark:bg-purple-900': activeChat?.deploymentConversationId === chat.deploymentConversationId
              }"
              class="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ chat.name }}</span>
              <div v-if="activeChat?.deploymentConversationId === chat.deploymentConversationId" class="flex items-center space-x-1">
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="editChat(chat)">
                  <IconPencil class="h-4 w-4" />
                </button>
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="deleteChat(chat.deploymentConversationId!)">
                  <IconTrashX class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- YESTERDAY -->
        <div v-if="groupedChats.yesterday.length > 0" class="mb-4">
          <div class="mb-1 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            YESTERDAY
          </div>
          <div class="space-y-1">
            <div
              v-for="chat in groupedChats.yesterday"
              :key="chat.deploymentConversationId"
              @click="onSwitchChat(chat.deploymentConversationId!)"
              :class="{
                'bg-purple-100 dark:bg-purple-900': activeChat?.deploymentConversationId === chat.deploymentConversationId
              }"
              class="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ chat.name }}</span>
              <div v-if="activeChat?.deploymentConversationId === chat.deploymentConversationId" class="flex items-center space-x-1">
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="editChat(chat)">
                  <IconPencil class="h-4 w-4" />
                </button>
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="deleteChat(chat.deploymentConversationId!)">
                  <IconTrashX class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2 DAYS AGO -->
        <div v-if="groupedChats.twoDaysAgo.length > 0" class="mb-4">
          <div class="mb-1 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            2 DAYS AGO
          </div>
          <div class="space-y-1">
            <div
              v-for="chat in groupedChats.twoDaysAgo"
              :key="chat.deploymentConversationId"
              @click="onSwitchChat(chat.deploymentConversationId!)"
              :class="{
                'bg-purple-100 dark:bg-purple-900': activeChat?.deploymentConversationId === chat.deploymentConversationId
              }"
              class="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ chat.name }}</span>
              <div v-if="activeChat?.deploymentConversationId === chat.deploymentConversationId" class="flex items-center space-x-1">
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="editChat(chat)">
                  <IconPencil class="h-4 w-4" />
                </button>
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="deleteChat(chat.deploymentConversationId!)">
                  <IconTrashX class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3 DAYS AGO -->
        <div v-if="groupedChats.threeDaysAgo.length > 0" class="mb-4">
          <div class="mb-1 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            3 DAYS AGO
          </div>
          <div class="space-y-1">
            <div
              v-for="chat in groupedChats.threeDaysAgo"
              :key="chat.deploymentConversationId"
              @click="onSwitchChat(chat.deploymentConversationId!)"
              :class="{
                'bg-purple-100 dark:bg-purple-900': activeChat?.deploymentConversationId === chat.deploymentConversationId
              }"
              class="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ chat.name }}</span>
              <div v-if="activeChat?.deploymentConversationId === chat.deploymentConversationId" class="flex items-center space-x-1">
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="editChat(chat)">
                  <IconPencil class="h-4 w-4" />
                </button>
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="deleteChat(chat.deploymentConversationId!)">
                  <IconTrashX class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 DAYS AGO -->
        <div v-if="groupedChats.fourDaysAgo.length > 0" class="mb-4">
          <div class="mb-1 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            4 DAYS AGO
          </div>
          <div class="space-y-1">
            <div
              v-for="chat in groupedChats.fourDaysAgo"
              :key="chat.deploymentConversationId"
              @click="onSwitchChat(chat.deploymentConversationId!)"
              :class="{
                'bg-purple-100 dark:bg-purple-900': activeChat?.deploymentConversationId === chat.deploymentConversationId
              }"
              class="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ chat.name }}</span>
              <div v-if="activeChat?.deploymentConversationId === chat.deploymentConversationId" class="flex items-center space-x-1">
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="editChat(chat)">
                  <IconPencil class="h-4 w-4" />
                </button>
                <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="deleteChat(chat.deploymentConversationId!)">
                  <IconTrashX class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-auto w-full border-t border-gray-200 px-2 py-2 dark:border-gray-800">
        <div class="mb-1 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
          TOOLS
        </div>
        <div class="flex items-center justify-between px-2 py-1">
          <div class="flex items-center space-x-2">
            <button class="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg class="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19.14 19.14L19.01 19.01M19.01 4.99L19.14 4.86L19.01 4.99ZM4.86 19.14L4.99 19.01L4.86 19.14ZM12 2.08V2V2.08ZM12 22V21.92V22ZM2.08 12H2H2.08ZM22 12H21.92H22ZM4.99 4.99L4.86 4.86L4.99 4.99Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg class="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" fill="currentColor"/>
              </svg>
            </button>
            <button class="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg class="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3H16M8 3V5H16V3M8 3H16M10 11L12 13M12 13L14 11M12 13V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="flex items-center">
            <span class="text-xs font-medium text-blue-600 dark:text-blue-400">NEW</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
