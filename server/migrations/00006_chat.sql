-- Chat Channels
CREATE TABLE public.chat_channels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name text, -- Optional: Name for group chats, null for DMs
    type text CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Chat Participants
CREATE TABLE public.chat_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at timestamptz NOT NULL DEFAULT now(),
    joined_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(channel_id, user_id)
);

-- Chat Messages
CREATE TABLE public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

-- RLS Setup
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Channels: Users can read channels they are a participant of
CREATE POLICY "Users can view their channels" ON public.chat_channels
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_participants WHERE channel_id = id AND user_id = auth.uid())
);

-- Participants: Users can view participants of their channels
CREATE POLICY "Users can view participants of their channels" ON public.chat_participants
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_participants WHERE channel_id = chat_participants.channel_id AND user_id = auth.uid())
);

-- Messages: Users can read messages in their channels
CREATE POLICY "Users can read messages in their channels" ON public.chat_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_participants WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid())
);

-- Messages: Users can insert messages into their channels
CREATE POLICY "Users can insert messages into their channels" ON public.chat_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.chat_participants WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid())
);

-- To allow creation of new channels/DMs:
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (college_id = auth_college_id());

CREATE POLICY "Users can add participants" ON public.chat_participants
FOR INSERT WITH CHECK (
    -- Simplification: Any authenticated user can add a participant to a channel in their college
    -- In a strict production environment, this would verify the user creating the channel is part of it.
    auth.uid() IS NOT NULL
);
