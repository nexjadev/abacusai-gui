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
  IconCheck,
  IconX,
} from '@tabler/icons-vue'

import {
  isDarkMode,
  isSystemPromptOpen,
  toggleSettingsPanel,
  toggleSystemPromptPanel,
} from '../services/appConfigAbacus.ts'
import { useChats } from '../services/chatAbacus2.ts'
import { Conversation } from '../services/apiAbacus2.ts'
import { computed, ref } from 'vue'

// Definir tipos para los elementos de la lista plana
type HeaderItem = {
  type: 'header'
  title: string
}

type ChatItem = {
  type: 'chat'
  chat: Conversation
}

type FlattenedItem = HeaderItem | ChatItem

const { chats, activeChat, switchChat, deleteChat, startNewChat, renameChat } = useChats()

const editingChatId = ref<string | null>(null)
const newChatName = ref('')

const onNewChat = () => {
  checkSystemPromptPanel()
  return startNewChat()
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

  // Crear un mapa para almacenar los chats agrupados por fecha
  const groups: Record<string, Conversation[]> = {}

  // Definir las fechas específicas para los primeros 5 grupos
  const specificDates = [
    { key: 'today', date: new Date(today), title: 'TODAY' },
    { key: 'yesterday', date: new Date(today.getTime() - 86400000), title: 'YESTERDAY' },
    { key: 'twoDaysAgo', date: new Date(today.getTime() - 86400000 * 2), title: '2 DAYS AGO' },
    { key: 'threeDaysAgo', date: new Date(today.getTime() - 86400000 * 3), title: '3 DAYS AGO' },
    { key: 'fourDaysAgo', date: new Date(today.getTime() - 86400000 * 4), title: '4 DAYS AGO' }
  ]

  // Inicializar los grupos específicos
  specificDates.forEach(({ key }) => {
    groups[key] = []
  })

  // Mapa para almacenar chats por fecha específica (para los chats más antiguos)
  const chatsByDate: Record<string, Conversation[]> = {}

  // Clasificar cada chat en su grupo correspondiente
  chats.value.forEach(chat => {
    const chatDate = new Date(chat.createdAt)
    chatDate.setHours(0, 0, 0, 0)

    // Verificar si el chat pertenece a alguno de los grupos específicos
    let assigned = false
    for (let i = 0; i < specificDates.length; i++) {
      const currentDate = specificDates[i].date
      const nextDate = i > 0 ? specificDates[i-1].date : new Date(today.getTime() + 86400000)

      if (chatDate >= currentDate && chatDate < nextDate) {
        groups[specificDates[i].key].push(chat)
        assigned = true
        break
      }
    }

    // Si no se asignó a ningún grupo específico, agrupar por fecha
    if (!assigned) {
      const dateKey = chatDate.toISOString().split('T')[0]
      if (!chatsByDate[dateKey]) {
        chatsByDate[dateKey] = []
      }
      chatsByDate[dateKey].push(chat)
    }
  })

  return {
    specificGroups: specificDates.map(({ key, title }) => ({
      key,
      title,
      chats: groups[key]
    })),
    otherGroups: Object.entries(chatsByDate)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, chats]) => {
        // Formatear la fecha según el idioma del navegador
        const formattedDate = new Date(date).toLocaleDateString(lang, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        return {
          key: date,
          title: formattedDate.toUpperCase(),
          chats
        }
      })
  }
})

// Crear una lista plana con cabeceras y chats
const flattenedChatList = computed<FlattenedItem[]>(() => {
  const result: FlattenedItem[] = []

  // Agregar los grupos específicos (HOY, AYER, etc.)
  groupedChats.value.specificGroups.forEach(group => {
    if (group.chats.length > 0) {
      result.push({ type: 'header', title: group.title })
      group.chats.forEach(chat => {
        result.push({ type: 'chat', chat })
      })
    }
  })

  // Agregar los grupos por fecha para chats más antiguos
  groupedChats.value.otherGroups.forEach(group => {
    result.push({ type: 'header', title: group.title })
    group.chats.forEach(chat => {
      result.push({ type: 'chat', chat })
    })
  })

  return result
})

const startEditing = (chatId: string, currentName: string) => {
  editingChatId.value = chatId
  newChatName.value = currentName
}

const confirmRename = (chatId: string) => {
  if (newChatName.value.trim()) {
    renameChat(chatId, newChatName.value.trim())
  }
  cancelEditing()
}

const cancelEditing = () => {
  editingChatId.value = null
  newChatName.value = ''
}

</script>

<template>
  <aside class="sidebar-container">
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
        <div class="space-y-1">
          <template v-for="(item, index) in flattenedChatList" :key="index">
            <!-- Elemento de cabecera (informativo) -->
            <div
              v-if="item.type === 'header'"
              class="mb-1 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
            >
              {{ (item as HeaderItem).title }}
            </div>

            <!-- Elemento de chat (interactivo) -->
            <div
              v-else-if="item.type === 'chat'"
              @click="onSwitchChat((item as ChatItem).chat.deploymentConversationId!)"
              :class="{
                'bg-purple-100 dark:bg-purple-900': activeChat?.deploymentConversationId === (item as ChatItem).chat.deploymentConversationId
              }"
              class="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span v-if="editingChatId !== (item as ChatItem).chat.deploymentConversationId" class="text-sm text-gray-900 dark:text-gray-100">{{ (item as ChatItem).chat.name }}</span>
              <div v-if="activeChat?.deploymentConversationId === (item as ChatItem).chat.deploymentConversationId" class="flex items-center space-x-1">
                <div v-if="editingChatId === (item as ChatItem).chat.deploymentConversationId" class="flex items-center space-x-1">
                  <input
                    v-model="newChatName"
                    type="text"
                    class="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    @keyup.enter="confirmRename((item as ChatItem).chat.deploymentConversationId!)"
                    @keyup.esc="cancelEditing()"
                    ref="editInput"
                    autofocus
                  />
                  <button
                    class="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    @click.stop="confirmRename((item as ChatItem).chat.deploymentConversationId!)"
                  >
                    <IconCheck class="h-4 w-4" />
                  </button>
                  <button
                    class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    @click.stop="cancelEditing()"
                  >
                    <IconX class="h-4 w-4" />
                  </button>
                </div>
                <template v-else>
                  <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="startEditing((item as ChatItem).chat.deploymentConversationId!, (item as ChatItem).chat.name)">
                    <IconPencil class="h-4 w-4" />
                  </button>
                  <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="deleteChat((item as ChatItem).chat.deploymentId!, (item as ChatItem).chat.deploymentConversationId!)">
                    <IconTrashX class="h-4 w-4" />
                  </button>
                </template>
              </div>
            </div>
          </template>
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

<style scoped>
.sidebar-container {
  position: relative;
  height: 100vh;
  z-index: 10;
  will-change: transform;
}
</style>
