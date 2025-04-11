import { useLocalStorage } from '@vueuse/core'
import gravatarUrl from 'gravatar-url'
import { computed, ref } from 'vue'
import { Config, db } from './database.ts'

export const currentModelId = useLocalStorage('currentModelId', '')
export const currentChatId = useLocalStorage('currentChatId', '')
export const currentUserId = useLocalStorage('currentUserId', '')
export const gravatarEmail = useLocalStorage('gravatarEmail', '')
export const historyChatLength = useLocalStorage('historyChatLength', 30)
export const avatarUrl = computed(() => gravatarEmail.value
  ? gravatarUrl(gravatarEmail.value, { size: 200, default: '/avatar.png' })
  : 'User.png',
)
export const enableMarkdown = useLocalStorage('markdown', true)
export const showSystem = useLocalStorage('systemMessages', true)
export const isDarkMode = useLocalStorage('darkMode', false)
export const isSettingsOpen = useLocalStorage('settingsPanelOpen', true)
export const isSystemPromptOpen = useLocalStorage('systemPromptOpen', false)
export const toggleSettingsPanel = () => (isSettingsOpen.value = !isSettingsOpen.value)
export const toggleSystemPromptPanel = () => (isSystemPromptOpen.value = !isSystemPromptOpen.value)
const imageDictionary = ref()

// Define a method to get the full API URL for a given path
// export const getApiUrl = (path: string) => `${'https://multimindai.lat/api'}${path}`
export const getApiUrl = (path: string) => `${'http://localhost:8000'}${path}`

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

  const getImageDictionary = (clave: string) => {
    const dictionary: Record<string, string> = {
      "afad40be8": "routeLLM.png",
      "b733f5c72": "gpt.webp",
      "3a59d8c0": "claude.webp",
      "cdc814e10": "gpt.webp",
      "d54ec9e9a": "gpt.webp",
      "dcd57ef24": "gpt.webp",
      "e45c33fae": "deepseek.webp",
      "ebe2e9038": "deepseek.webp",
      "f3699e0c2": "gemini.webp",
      "e42560dec": "gemini.webp",
      "10277081d6": "gemini.webp",
      "aa1cf109c": "gemini.webp",
      "11184722ea": "gpt.webp",
      "1190b27374": "grok.webp",
      "12091dc3fe": "deepseek.webp",
      "1281891488": "smaug.webp",
      "12f9f46512": "llama3.webp",
      "fb1a29476": "qwen.webp",
      "d3be0e3c0": "",
      "14b6c52928": "",
      "bebaaacfc": "claude.webp",
      "13eacb0626": "",
      "13725fb59c": "searchLLM.webp",
      "5c0b8b18e": "gpt.webp"
    }
    return dictionary[clave] ?? ''
  }

  const getNickImageDictionary = (clave: string) => {
    const dictionary: Record<string, string> = {
      "routeLLM.webp": "routeLLM.png",
      "gpt.webp": "gpt.webp",
      "claude.webp": "claude.webp",
      "deepseek.webp": "deepseek.webp",
      "gemini.webp": "gemini.webp",
      "grok.webp": "grok.webp",
      "smaug.webp": "smaug.webp",
      "llama3.webp": "llama3.webp",
      "qwen.webp": "qwen.webp",
      "searchLLM.webp": "searchLLM.webp",
    }
    return dictionary[clave] ?? 'routeLLM.png'
  }

  const getRoutingDictionary = (clave: string) => {
    const dictionary: Record<string, string> = {
      "OPENAI_GPT4O": "Routing to GPT-4o",
      "CLAUDE_V3_5_SONNET": "Routing to Claude 3.5 Sonnet",
    }
    return dictionary[clave] ?? ''
  }
  return {
    initializeConfig,
    setConfig,
    getCurrentSystemMessage,
    historyChatLength,
    getImageDictionary,
    getRoutingDictionary,
    getNickImageDictionary,
  }
}
