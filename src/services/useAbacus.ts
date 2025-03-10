import { ref } from 'vue'
import { ExternalApplication, useApi } from './apiAbacusai'

const availableModels = ref<ExternalApplication[]>([])

export const useAI = () => {
  const { listModels } = useApi()

  const refreshModels = async () => {
    const response = await listModels()
    availableModels.value = response.result ?? []
  }

  // Use toRefs to keep reactivity when destructuring in components.
  return {
    availableModels,
    refreshModels,
  }
}
