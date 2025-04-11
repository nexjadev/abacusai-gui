import { Message } from "./message.dto";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  llm_model_id: string;
  system_prompt_id: string | null;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
}

export type CreateConversationRequest = {
  title: string;
  user_id: string;
  llm_model_id: string;
  system_prompt_id: string | null;
};

export type TitleConversationRequest = {
  conversation_id: string;
  user_id: string;
  user_message: string;
}

export type RenameConversationRequest = {
  conversation_id: string;
  user_id: string;
  new_title: string;
}

export type DeleteConversationRequest = {
  conversation_id: string;
  user_id: string;
}
