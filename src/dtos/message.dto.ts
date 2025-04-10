export interface Message {
  message_id: string
  content: string
  role: 'user' | 'assistant'
  conversation_id: string
  createdAt: Date
  updatedAt: Date
}

export interface MessageChatRequest {
  conversation_id: string;
  message: string;
  user_id: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}
