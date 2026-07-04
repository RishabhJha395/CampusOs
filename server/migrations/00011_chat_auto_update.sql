-- Automatically update chat_channels.updated_at when a new message is inserted
CREATE OR REPLACE FUNCTION public.update_channel_timestamp_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_channels
    SET updated_at = NOW()
    WHERE id = NEW.channel_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_channel_timestamp ON public.chat_messages;

CREATE TRIGGER trigger_update_channel_timestamp
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_channel_timestamp_on_message();
