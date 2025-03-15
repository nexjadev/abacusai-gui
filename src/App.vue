<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import ChatInput from './components/ChatInput.vue'
import ChatMessages from './components/ChatMessages.vue'
// import SystemPrompt from './components/SystemPrompt.vue'
import ModelSelector from './components/ModelSelector.vue'
import {
  currentModelId,
  isDarkMode,
  isSettingsOpen,
  isSystemPromptOpen,
} from './services/appConfigAbacus.ts'
import { IconMenu, IconPlus } from '@tabler/icons-vue'
import { nextTick, onMounted, ref } from 'vue'
import { useAI } from './services/useAbacus.ts'
import { useChats } from './services/chatAbacus2.ts'
import { Conversation } from './services/apiAbacus2.ts'
// import TextInput from './components/Inputs/TextInput.vue'
// import Settings from './components/Settings.vue'

const { refreshModels, availableModels } = useAI()
const { activeChat, renameChat, switchModel, initialize, startNewChat, switchChat, chats } = useChats()
const isEditingChatName = ref(false)
const editedChatName = ref('')
const chatNameInput = ref()
const isSidebarOpen = ref(true)

const startEditing = () => {
  isEditingChatName.value = true
  editedChatName.value = activeChat.value?.name || ''
  nextTick(() => {
    if (!chatNameInput.value) return
    const input = chatNameInput.value.$el.querySelector('input')
    input.focus()
    input.select()
  })
}

const cancelEditing = () => {
  isEditingChatName.value = false
  editedChatName.value = ''
}

const confirmRename = () => {
  if (activeChat.value && editedChatName.value) {
    // renameChat(editedChatName.value)
    isEditingChatName.value = false
  }
}

const onNewChat = () => {
  checkSystemPromptPanel()

  // Buscar un chat vacío del día actual
  const today = new Date()
  const emptyChat = chats.value.find((chat: Conversation) => {
    const chatDate = new Date(chat.createdAt)
    return chatDate.toDateString() === today.toDateString() &&
           (!chat.history || chat.history.length === 0)
  })

  if (emptyChat) {
    // Si encontramos un chat vacío del día actual, lo seleccionamos
    return switchChat(emptyChat.deploymentConversationId)
  }

  // Si no hay chats vacíos del día actual, creamos uno nuevo
  return startNewChat()
}

const checkSystemPromptPanel = () => {
  isSystemPromptOpen.value = false
}

onMounted(() => {
  refreshModels().then(async () => {
    if (currentModelId.value) {
      await switchModel(currentModelId.value)
    } else {
      await switchModel(availableModels.value[0].deploymentId)
    }
    await initialize()
  })
})
</script>

<template>
  <div :class="{ dark: isDarkMode }">
    <main
      class="flex h-full w-full flex-1 flex-row items-stretch bg-white dark:bg-gray-900"
    >
        <transition name="slide-sidebar">
          <Sidebar v-if="isSidebarOpen" />
        </transition>

      <div
        class="mx-auto flex h-screen w-full flex-col transition-all duration-300"
      >
        <div
          v-if="isSystemPromptOpen"
          class="mx-auto flex h-screen w-full max-w-5xl flex-col gap-4 px-4 pb-4"
        >
          <!-- <SystemPrompt /> -->
        </div>

        <div id=""
          v-if="!isSystemPromptOpen"
          class="mx-auto flex h-screen w-full flex-col gap-4 pb-4"
        >
          <div
            class="flex w-full flex-row justify-between gap-4 bg-gray-100 px-4 py-2 dark:bg-gray-800"
          >
            <div class="flex flex-row gap-4">
              <button
                type="button"
                class="flex items-center justify-center rounded-lg p-2 text-gray-600 transition-all duration-300 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="isSidebarOpen = !isSidebarOpen"
                :title="isSidebarOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'"
              >
                <!-- Icono cuando el sidebar está abierto -->
                <svg v-if="isSidebarOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-layout-sidebar-left-collapse">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M18 3a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h12zm0 2h-9v14h9a1 1 0 0 0 .993 -.883l.007 -.117v-12a1 1 0 0 0 -.883 -.993l-.117 -.007zm-3.293 4.293a1 1 0 0 1 .083 1.32l-.083 .094l-1.292 1.293l1.292 1.293a1 1 0 0 1 .083 1.32l-.083 .094a1 1 0 0 1 -1.32 .083l-.094 -.083l-2 -2a1 1 0 0 1 -.083 -1.32l.083 -.094l2 -2a1 1 0 0 1 1.414 0z" />
                </svg>

                <!-- Icono cuando el sidebar está cerrado -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-layout-sidebar-right">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M18 3a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h12zm-8 2h-4a1 1 0 0 0 -.993 .883l-.007 .117v12a1 1 0 0 0 .883 .993l.117 .007h4v-14zm7.293 4.293a1 1 0 0 1 .083 1.32l-.083 .094l-2 2a1 1 0 0 1 -1.32 .083l-.094 -.083a1 1 0 0 1 -.083 -1.32l.083 -.094l1.292 -1.293l-1.292 -1.293a1 1 0 0 1 -.083 -1.32l.083 -.094a1 1 0 0 1 1.32 -.083l.094 .083l2 2z" />
                </svg>
              </button>

              <button
                type="button"
                class="flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="onNewChat"
              >
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-text-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 10h-14" /><path d="M5 6h14" /><path d="M14 14h-9" /><path d="M5 18h6" /><path d="M18 15v6" /><path d="M15 18h6" /></svg>
              </button>
            </div>
            <div class="mr-auto flex h-full items-center" v-if="activeChat">
              <div>
                <div v-if="isEditingChatName">
                  <!-- <TextInput
                    id="chat-name"
                    v-model="editedChatName"
                    ref="chatNameInput"
                    @keyup.enter="confirmRename"
                    @keyup.esc="cancelEditing"
                    @blur="cancelEditing"
                  /> -->
                </div>

                <!-- <button
                  type="button"
                  class="block h-full rounded border-none p-2 text-gray-900 decoration-gray-400 decoration-dashed outline-none hover:underline focus:ring-2 focus:ring-blue-600 dark:text-gray-100 dark:focus:ring-blue-600"
                  v-else
                  @click.prevent="startEditing"
                >
                  {{ activeChat.name }}
                </button> -->
              </div>
            </div>

            <ModelSelector />
          </div>

          <ChatMessages />
          <ChatInput />
        </div>
      </div>

      <transition name="slide">
        <Settings v-if="isSettingsOpen" />
      </transition>
    </main>
  </div>
</template>
