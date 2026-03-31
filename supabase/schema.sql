-- Users table (mirrors Supabase Auth users, stores app-specific data)
CREATE TABLE users (
  id            UUID PRIMARY KEY,
  email         TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Anonymous sessions (tracked by cookie for 3-question limit)
CREATE TABLE anonymous_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token   TEXT NOT NULL UNIQUE,
  questions_used  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anon_sessions_token ON anonymous_sessions(session_token);

-- Chats
CREATE TABLE chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_id     UUID REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New chat',
  provider    TEXT NOT NULL DEFAULT 'openai',
  model       TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_chat_owner CHECK (
    (user_id IS NOT NULL AND anon_id IS NULL) OR
    (user_id IS NULL AND anon_id IS NOT NULL)
  )
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_anon_id ON chats(anon_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);

-- Messages
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  provider    TEXT,
  model       TEXT,
  tokens_in   INT,
  tokens_out  INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at);

-- Attachments (images and documents, stored in Supabase Storage)
CREATE TABLE attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    UUID REFERENCES messages(id) ON DELETE CASCADE,
  chat_id       UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INT NOT NULL,
  storage_path  TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('image', 'document')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_message_id ON attachments(message_id);
CREATE INDEX idx_attachments_chat_id ON attachments(chat_id);

-- Document chunks (extracted text from uploaded documents)
CREATE TABLE document_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id   UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_chunks_chat_id ON document_chunks(chat_id);
CREATE INDEX idx_doc_chunks_attachment_id ON document_chunks(attachment_id);

-- Helper function for atomic question increment
CREATE OR REPLACE FUNCTION increment_questions_used(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE anonymous_sessions
  SET questions_used = questions_used + 1
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime on chats table (for cross-tab sync)
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow service-role full access to attachments bucket
CREATE POLICY "Service role can upload" ON storage.objects
  FOR INSERT TO service_role WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Service role can read" ON storage.objects
  FOR SELECT TO service_role USING (bucket_id = 'attachments');

CREATE POLICY "Service role can delete" ON storage.objects
  FOR DELETE TO service_role USING (bucket_id = 'attachments');
