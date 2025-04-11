export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  conversation_id: string
  llm_model_id: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MessageChatRequest {
  conversation_id: string;
  message: string;
  user_id: string;
  llm_model_id: string;
}
