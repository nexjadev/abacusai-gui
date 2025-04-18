<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import ChatInput from './components/ChatInput.vue'
import ChatMessages from './components/ChatMessages.vue'
import Login from './components/Login.vue'
// import SystemPrompt from './components/SystemPrompt.vue'
import ModelSelector from './components/ModelSelector.vue'

import {
  currentModelId,
  isDarkMode,
  isSettingsOpen,
  isSystemPromptOpen,
} from './services/appConfig.ts'
import { IconMenu, IconPlus } from '@tabler/icons-vue'
import { nextTick, onMounted, ref } from 'vue'
import { useAI } from './services/useAi.ts'
import { useChats } from './services/chat.ts'
import { useAuth } from './services/auth.ts'

const { refreshModels, availableModels } = useAI()
const { switchModel, initialize, startNewChat, forceRoutingAction } = useChats()
const isSidebarOpen = ref(true)
const { isAuthenticated } = useAuth()

const onNewChat = () => {
  forceRoutingAction.value = false
  checkSystemPromptPanel()
  startNewChat()
}

const checkSystemPromptPanel = () => {
  isSystemPromptOpen.value = false
}

const initializeApp = async () => {
  try {
    await refreshModels()
    if (currentModelId.value) {
      await switchModel(currentModelId.value)
    } else if (availableModels.value && availableModels.value.length > 0) {
      await switchModel(availableModels.value[0].id)
    } else {
      console.error('No hay modelos disponibles para inicializar la aplicación')
    }
    await initialize()
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error)
  }
}

const onLoginSuccess = () => {
  isAuthenticated.value = true
  // Asegurarnos de que la inicialización comience después de que se actualice isAuthenticated
  nextTick(async () => {
    await initializeApp()
  })
}

onMounted(() => {
  if (isAuthenticated.value) {
    initializeApp()
  }
})
</script>

<template>
  <div :class="{ dark: isDarkMode }">
    <main
      class="flex h-full w-full flex-1 flex-row items-stretch bg-white dark:bg-gray-900"
    >
      <Login v-if="!isAuthenticated" @login-success="onLoginSuccess" />

      <template v-else>
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
                  <!-- Icono de nuevo chat -->
                  <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-text-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 10h-14" /><path d="M5 6h14" /><path d="M14 14h-9" /><path d="M5 18h6" /><path d="M18 15v6" /><path d="M15 18h6" /></svg>
                </button>
              </div>

              <ModelSelector />
            </div>

            <ChatMessages />
            <ChatInput />
          </div>
        </div>

        <!-- <transition name="slide">
          <Settings v-if="isSettingsOpen" />
        </transition> -->
      </template>
    </main>
  </div>
</template>
