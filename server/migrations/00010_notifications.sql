-- RPC to mark a channel as read by the current user
CREATE OR REPLACE FUNCTION public.mark_channel_read(p_channel_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.chat_participants
    SET last_read_at = NOW()
    WHERE channel_id = p_channel_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Type for unread counts
CREATE TYPE public.channel_unread_count AS (
    channel_id uuid,
    unread_count integer
);

-- RPC to get unread counts for all channels the user is in
CREATE OR REPLACE FUNCTION public.get_unread_counts()
RETURNS SETOF public.channel_unread_count AS $$
BEGIN
    RETURN QUERY
    SELECT c.channel_id, COUNT(m.id)::integer as unread_count
    FROM public.chat_participants c
    JOIN public.chat_messages m ON m.channel_id = c.channel_id
    WHERE c.user_id = auth.uid() 
      AND m.sender_id != auth.uid()
      AND (c.last_read_at IS NULL OR m.created_at > c.last_read_at)
    GROUP BY c.channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
