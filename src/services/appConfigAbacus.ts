import { useLocalStorage } from '@vueuse/core'
import gravatarUrl from 'gravatar-url'
import { computed } from 'vue'
import { Config, db } from './databaseAbacus.ts'

export const currentModelId = useLocalStorage('currentModelId', '')
export const currentExtAppId = useLocalStorage('currentExtAppId', '')
export const currentChatId = useLocalStorage('currentChatId', '')
export const gravatarEmail = useLocalStorage('gravatarEmail', '')
export const historyChatLength = useLocalStorage('historyChatLength', 30)
export const avatarUrl = computed(() => gravatarEmail.value
  ? gravatarUrl(gravatarEmail.value, { size: 200, default: '/avatar.png' })
  : 'User.png',
)
export const enableMarkdown = useLocalStorage('markdown', true)
export const showSystem = useLocalStorage('systemMessages', true)
export const baseUrl = useLocalStorage('baseUrl', 'http://3.21.99.235:8000')
export const isDarkMode = useLocalStorage('darkMode', false)
export const isSettingsOpen = useLocalStorage('settingsPanelOpen', true)
export const isSystemPromptOpen = useLocalStorage('systemPromptOpen', false)
export const toggleSettingsPanel = () => (isSettingsOpen.value = !isSettingsOpen.value)
export const toggleSystemPromptPanel = () => (isSystemPromptOpen.value = !isSystemPromptOpen.value)

// Database Layer
export const configDbLayer = {
  async getConfig(deploymentId: string) {
    const filteredConfig = await db.config.where('deploymentId').equals(deploymentId).limit(1)
    return filteredConfig.first()
  },

  async getCurrentConfig(deploymentId: string) {
    let config = await this.getConfig(deploymentId)
    if (!config?.systemPrompt) {
      config = await this.getConfig('15f05b288a')
    }
    return config
  },

  async setConfig(config: Config) {
    await db.config.put(config)
  },

  async clearConfig() {
    return db.config.clear()
  },
}

export function useConfig() {
  const setConfig = async (newConfig: Config) => {
    newConfig.id = await generateIdFromModel(newConfig.deploymentId)
    await configDbLayer.setConfig(newConfig)
  }

  const getCurrentSystemMessage = async () => {
    let config = await configDbLayer.getCurrentConfig(currentModelId.value)
    return config?.systemPrompt ?? null
  }

  const generateIdFromModel = async (deploymentId: string): Promise<number> => {
    let hash = 0
    for (let i = 0; i < deploymentId.length; i++) {
      hash += deploymentId.charCodeAt(i)
    }
    return hash
  }

  const initializeConfig = async (deploymentId: string) => {
    try {
      const modelConfig = await configDbLayer.getConfig(deploymentId)
      const defaultConfig = await configDbLayer.getConfig('15f05b288a')
      return { modelConfig: modelConfig, defaultConfig: defaultConfig }
    } catch (error) {
      console.error('Failed to initialize config:', error)
    }
    return null
  }

  return {
    initializeConfig,
    setConfig,
    getCurrentSystemMessage,
    historyChatLength,
  }
}
