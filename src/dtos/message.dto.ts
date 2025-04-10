export interface Message {
  messageId: string
  content: string
  role: 'user' | 'assistant'
  conversationId: number
  createdAt: Date
  updatedAt: Date
}

export interface MessageChatRequest {
  conversationId: number;
  message: string;
  userId: number;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
