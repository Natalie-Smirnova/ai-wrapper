export interface Chat {
  id: string;
  user_id: string | null;
  anon_id: string | null;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChatInput {
  title?: string;
  provider?: string;
  model?: string;
}

export interface UpdateChatInput {
  title?: string;
  provider?: string;
  model?: string;
}
