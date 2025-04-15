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
  IconLogout,
} from '@tabler/icons-vue'

import {
  isDarkMode,
  isSystemPromptOpen,
  toggleSettingsPanel,
  toggleSystemPromptPanel,
} from '../services/appConfig.ts'
import { useChats } from '../services/chat.ts'
import { computed, ref, onMounted } from 'vue'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useAuth } from '../services/auth.ts'
import AlertDialog from './AlertDialog.vue'
import { Conversation } from '../dtos/conversation.dto.ts'

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

const { chats, activeChat, switchChat, deleteChat, renameChat, getChats, getAllDocumentsUploaded, filesUploaded, documentsUploaded } = useChats()
const { logout } = useAuth()

const editingChatId = ref<string | null>(null)
const newChatName = ref('')
const searchTerm = ref('')

const showDeleteAlert = ref(false)
const chatToDelete = ref<{ conversationId: string } | null>(null)

const onSwitchChat = async (conversationId: string) => {
  checkSystemPromptPanel()
  await switchChat(conversationId)
  filesUploaded.value = []
  documentsUploaded.value = []
  await getAllDocumentsUploaded()
}

const checkSystemPromptPanel = () => {
  isSystemPromptOpen.value = false
}

const handleLogout = () => {
  logout()
  // Redirigir al usuario a la página de login o recargar la aplicación
  window.location.href = '/'
}

const lang = navigator.language

const { handleChatScroll } = useInfiniteScroll()

// Función para filtrar chats basado en el término de búsqueda
const filteredChats = computed(() => {
  if (!searchTerm.value.trim()) {
    return chats.value
  }
  const term = searchTerm.value.toLowerCase().trim()
  return chats.value.filter(chat =>
    chat.title.toLowerCase().includes(term)
  )
})

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

  // Usar filteredChats en lugar de chats.value
  filteredChats.value.forEach(chat => {
    const chatDate = new Date(chat.created_at)
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

const onScroll = async (event: Event) => {
  await handleChatScroll(event, async () => {
    // Recargar los chats cuando se llegue al final del scroll
    await getChats()
  })
}

const handleDeleteClick = (conversationId: string) => {
  chatToDelete.value = { conversationId }
  showDeleteAlert.value = true
}

const handleDeleteConfirm = () => {
  if (chatToDelete.value) {
    deleteChat(chatToDelete.value.conversationId)
    chatToDelete.value = null
  }
}

</script>

<template>
  <aside class="sidebar-container">
    <div
      class="flex h-screen w-60 flex-col overflow-y-auto border-r border-gray-200 bg-gray-100 pt-2 dark:border-gray-800 dark:bg-gray-900 sm:h-screen sm:w-64"
    >
      <div class="mx-2 mb-2">
        <div class="relative">
          <input
            v-model="searchTerm"
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

      <div class="h-full custom-scrollbar overflow-y-auto px-2 py-1" @scroll="onScroll">
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
              @click="onSwitchChat((item as ChatItem).chat.id!)"
              :class="{
                'bg-purple-100 dark:bg-purple-900': activeChat?.id == (item as ChatItem).chat.id
              }"
              class="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span v-if="editingChatId !== (item as ChatItem).chat.id" class="text-sm text-gray-900 dark:text-gray-100">{{ (item as ChatItem).chat.title }}</span>
              <div v-if="activeChat?.id == (item as ChatItem).chat.id" class="flex items-center space-x-1">
                <div v-if="editingChatId == (item as ChatItem).chat.id" class="flex items-center space-x-1">
                  <input
                    v-model="newChatName"
                    type="text"
                    class="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    @keyup.enter="confirmRename((item as ChatItem).chat.id!)"
                    @keyup.esc="cancelEditing()"
                    ref="editInput"
                    autofocus
                  />
                  <button
                    class="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    @click.stop="confirmRename((item as ChatItem).chat.id!)"
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
                  <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="startEditing((item as ChatItem).chat.id!, (item as ChatItem).chat.title)">
                    <IconPencil class="h-4 w-4" />
                  </button>
                  <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" @click.stop="handleDeleteClick((item as ChatItem).chat.id!)">
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
            <button
              class="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
              @click="isDarkMode = !isDarkMode"
            >
              <IconSun v-if="isDarkMode" class="h-6 w-6 text-gray-600 dark:text-gray-300" />
              <IconMoon v-else class="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <!-- botón logout -->
          <button
            class="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
            @click="handleLogout"
            title="Cerrar sesión"
          >
            <IconLogout class="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </div>
    <AlertDialog
      :is-open="showDeleteAlert"
      title="Eliminar chat"
      message="¿Estás seguro de que deseas eliminar este chat? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      @confirm="handleDeleteConfirm"
      @close="showDeleteAlert = false"
    />
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
