import { Message } from "./message.dto";

export interface Conversation {
  conversationId: number;
  userId: number;
  title: string;
  llmModelId: number;
  systemPromptId: number | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateConversationRequest = {
  title: string;
  user_id: number;
  llm_model_id: number;
  system_prompt_id: number | null;
};

export type TitleConversationRequest = {
  conversation_id: number;
  user_id: number;
  user_message: string;
}

export type RenameConversationRequest = {
  conversation_id: number;
  user_id: number;
  new_title: string;
}