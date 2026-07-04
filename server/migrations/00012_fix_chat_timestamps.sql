-- Retroactively update all chat channels to have the correct updated_at 
-- based on their most recent message.
UPDATE public.chat_channels c
SET updated_at = COALESCE(
    (SELECT MAX(created_at) FROM public.chat_messages WHERE channel_id = c.id),
    c.created_at
);
