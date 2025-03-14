<script setup lang="ts">
import { IconRefresh } from '@tabler/icons-vue'
import { useChats } from '../services/chatAbacus2.ts'
import { useAI } from '../services/useAbacus.ts'
import { ref } from 'vue'
import { currentModelId } from '../services/appConfigAbacus.ts'

const { activeChat, switchModel, hasMessages } = useChats()
const { refreshModels, availableModels } = useAI()

const refreshingModel = ref(false)

const performRefreshModel = async () => {
  refreshingModel.value = true
  await refreshModels()
  refreshingModel.value = false
}

const handleModelChange = (event: Event) => {
  const wip = event.target as HTMLSelectElement
  console.log('switch', wip.value)
  // switchModel(wip.value)
}

type Props = {
  disabled?: boolean
}
const { disabled = false } = defineProps<Props>()
</script>

<template>
  <div class="flex flex-row text-gray-900 dark:text-gray-100">
    <div class="inline-flex items-center gap-2">
      <select
        :disabled="disabled"
        :value="activeChat?.deploymentId ?? currentModelId"
        @change="handleModelChange"
        class="w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100"
      >
        <option :value="undefined" disabled selected>Select a model</option>
        <option v-for="model in availableModels" :value="model.deploymentId">
          {{ model.name }}
        </option>
      </select>

      <button
        :disabled="disabled"
        title="Refresh available models"
        @click="performRefreshModel"
        class="flex items-center justify-center rounded-lg p-2 text-gray-600 transition-all duration-300 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <IconRefresh
          class="h-5 w-5 -scale-100 text-gray-900 decoration-gray-400 decoration-dashed outline-none hover:underline focus:ring-2 focus:ring-blue-600 dark:text-gray-100 dark:focus:ring-blue-600"
          :class="{ 'animate-spin': refreshingModel }"
        />
      </button>
    </div>
  </div>
</template>
