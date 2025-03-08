// database.ts
import Dexie from 'dexie'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface Config {
  id?: number
  deploymentId: string
  systemPrompt: string
  createdAt: Date
}

class ChatDatabase extends Dexie {
  config: Dexie.Table<Config, number>

  constructor() {
    super('ChatDatabase')
    this.version(10).stores({
      config: '++id,deploymentId,systemPrompt,createdAt',
    })

    this.config = this.table('config')
  }
}

export const db = new ChatDatabase()
