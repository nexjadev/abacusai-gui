<script setup lang="ts">
import { IconRefresh, IconSearch } from '@tabler/icons-vue'
import { useChats } from '../services/chat.ts'
import { useAI } from '../services/useAi.ts'
import { ref, computed } from 'vue'
import { useConfig } from '../services/appConfig.ts'
import type { ExternalApplication } from '../services/api.ts'

const { activeChat, activeModel, switchModel, hasMessages } = useChats()
const { refreshModels, availableModels } = useAI()
const { getImageDictionary } = useConfig()

const refreshingModel = ref(false)
const searchQuery = ref('')
const activeTab = ref('all')
const isOpen = ref(false)

const tabs = [
  { id: 'all', name: 'All', count: computed(() => availableModels.value?.length || 0) },
  // { id: 'llms', name: 'LLMs', count: 18 },
  // { id: 'custom', name: 'Custom Bots', count: 2 }
]

const filteredModels = computed(() => {
  return (availableModels.value || []).filter((model: ExternalApplication) =>
    model.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const performRefreshModel = async () => {
  refreshingModel.value = true
  await refreshModels()
  refreshingModel.value = false
}

const handleModelChange = (modelId: string) => {
  console.log('switch', modelId)
  const selectedModel = availableModels.value?.find(model => model.externalApplicationId === modelId)
  if (selectedModel) {
    switchModel(selectedModel.deploymentId, selectedModel.externalApplicationId)
    isOpen.value = false
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

type Props = {
  disabled?: boolean
}
const { disabled = false } = defineProps<Props>()
</script>

<template>
  <div class="relative text-gray-900 dark:text-gray-100">
    <!-- Selected Model Button -->
    <button
      @click="toggleDropdown"
      :disabled="disabled"
      class="flex w-full items-center gap-3 rounded-lg bg-white p-2 text-left hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
    >
      <div class="flex h-7 w-7 items-center justify-center rounded-lg">
        <img class="size-7 aspect-square rounded-full border border-gray-200 bg-white object-contain"
          :src="getImageDictionary(activeModel?.externalApplicationId || '')" :alt="activeModel?.name || 'AI'" />
      </div>
      <div class="flex-1">
        <div class="text-sm font-medium">{{ activeModel?.name || 'Select a model' }}</div>
      </div>
      <svg
        class="h-5 w-5 transform text-gray-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Dropdown Content -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-10 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700 w-[400px] max-h-[calc(100vh-100px)] flex flex-col"
    >
      <div class="flex flex-col gap-4 p-4">
        <!-- Search Bar -->
        <div class="relative">
          <IconSearch class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Bot..."
            v-model="searchQuery"
            class="w-full rounded-lg bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 text-sm font-medium',
              activeTab === tab.id
                ? 'border-b-2 border-purple-500 text-purple-600 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-100'
            ]"
          >
            {{ tab.name }}
            <span class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-600">
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Model List -->
        <div class="flex flex-col gap-2 custom-scrollbar overflow-y-auto max-h-[calc(100vh-300px)]">
          <button
            v-for="model in filteredModels"
            :key="model.externalApplicationId"
            :disabled="disabled"
            @click="handleModelChange(model.externalApplicationId)"
            class="flex items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
            :class="{ 'bg-purple-50 dark:bg-purple-900/20': model.externalApplicationId === activeModel?.externalApplicationId }"
          >
            <div class="flex h-7 w-7 items-center justify-center rounded-lg">
              <img class="size-7 aspect-square rounded-full border border-gray-200 bg-white object-contain"
                :src="getImageDictionary(model?.externalApplicationId || '')" :alt="model?.name || 'AI'" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium">{{ model.name }}</div>
            </div>
          </button>
        </div>

        <!-- Refresh Button -->
        <button
          :disabled="disabled"
          title="Refresh available models"
          @click="performRefreshModel"
          class="flex items-center justify-center rounded-lg p-2 text-gray-600 transition-all duration-300 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <IconRefresh
            class="h-5 w-5 -scale-100"
            :class="{ 'animate-spin': refreshingModel }"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
