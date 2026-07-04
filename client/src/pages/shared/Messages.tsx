import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { useMyChannels, useMessages, useSendMessage, useEditMessage, useCreateDirectMessage } from '../../features/chat/hooks/useChat';
import { useUnreadCounts, useMarkChannelRead } from '../../features/notifications/hooks/useNotifications';
import { authService } from '../../features/auth/services/authService';
import { MessageSquare, Send, MessageCircle, Edit2, Plus, Search, X, Check } from 'lucide-react';

export function Messages() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { data: channels, isLoading: isLoadingChannels } = useMyChannels(profile?.id || '');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  
  const { data: messages, isLoading: isLoadingMessages } = useMessages(selectedChannelId);
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const createDirectChat = useCreateDirectMessage();
  
  const { data: unreadCounts } = useUnreadCounts();
  const markChannelRead = useMarkChannelRead();
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark channel as read when opened or when new messages arrive while open
  useEffect(() => {
    if (selectedChannelId) {
      markChannelRead.mutate(selectedChannelId);
    }
  }, [selectedChannelId, messages]);

  // Handle ?newUserId parameter from other pages (e.g. Marketplace)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newUserId = searchParams.get('newUserId');
    
    const initChat = async () => {
      if (!newUserId || !profile || isLoadingChannels || !channels) return;
      
      // Remove param from URL
      navigate('/chat', { replace: true });
      
      const existingChannel = channels.find(c => 
        c.type === 'direct' && 
        c.participants?.some((p: any) => p.user_id === newUserId)
      );
      
      if (existingChannel) {
        setSelectedChannelId(existingChannel.id);
      } else {
        try {
          const channel = await createDirectChat.mutateAsync({
            collegeId: profile.college_id,
            myId: profile.id,
            otherId: newUserId
          });
          if (channel) setSelectedChannelId(channel.id);
        } catch (err) {
          console.error(err);
        }
      }
    };
    
    initChat();
  }, [location.search, profile, isLoadingChannels, channels]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId || !profile) return;

    if (editingMsgId) {
      if (!editContent.trim()) return;
      const content = editContent;
      setEditingMsgId(null);
      setEditContent('');
      try {
        await editMessage.mutateAsync({ 
          messageId: editingMsgId, 
          newContent: content,
          channelId: selectedChannelId
        });
      } catch (err: any) {
        console.error('Failed to edit message', err);
        alert(`Failed to edit message: ${err.message}`);
      }
    } else {
      if (!newMessage.trim()) return;
      const content = newMessage;
      setNewMessage('');
      try {
        await sendMessage.mutateAsync({
          channelId: selectedChannelId,
          senderId: profile.id,
          content
        });
      } catch (err: any) {
        console.error('Failed to send message', err);
        alert(`Failed to send message: ${err.message}`);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    // RLS will automatically restrict this search if we are querying profiles we aren't allowed to see!
    // But since the new policies allow linking within the same college, we can just search college_id!
    const { data } = await authService.supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${searchQuery}%`)
      .limit(10);
      
    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!profile) return;
    try {
      console.log(`Attempting to start chat with ${otherUserId} as ${profile.role}`);
      const channel = await createDirectChat.mutateAsync({
        collegeId: profile.college_id,
        myId: profile.id,
        otherId: otherUserId
      });
      console.log("Chat started successfully, channel:", channel);
      if (!channel) {
         throw new Error("RPC succeeded but the channel was not found in getMyChannels afterwards (RLS issue?)");
      }
      setSelectedChannelId(channel.id);
      setIsNewChatModalOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      console.error("Chat Start Error:", err);
      alert(`Could not start chat: ${err.message || JSON.stringify(err)}`);
    }
  };

  const getOtherParticipant = (channel: any) => {
    return channel.participants?.find((p: any) => p.user_id !== profile?.id)?.profile;
  };

  const canEdit = (msg: any) => {
    if (msg.sender_id !== profile?.id) return false;
    const msgTime = new Date(msg.created_at).getTime();
    const now = new Date().getTime();
    // 10 minutes in milliseconds
    return (now - msgTime) <= 10 * 60 * 1000;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden relative">
      
      {/* Left Pane: Channels List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <MessageSquare className="mr-3 text-primary-500" />
            Messages
          </h1>
          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-xl transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingChannels ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : channels?.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <MessageCircle size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p>No active conversations.</p>
              <button 
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                Start a New Chat
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {channels?.map((channel) => {
                const otherPerson = channel.type === 'direct' ? getOtherParticipant(channel) : null;
                const displayName = channel.type === 'direct' ? otherPerson?.full_name : channel.name;
                const displayRole = channel.type === 'direct' ? otherPerson?.role?.replace('_', ' ') : 'Group';
                const unread = unreadCounts?.find(u => u.channel_id === channel.id)?.unread_count || 0;
                
                return (
                  <div 
                    key={channel.id}
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`p-3 rounded-2xl cursor-pointer flex items-center transition-all ${
                      selectedChannelId === channel.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 shrink-0 relative ${
                      selectedChannelId === channel.id
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                    }`}>
                      {displayName?.charAt(0) || 'G'}
                      {unread > 0 && selectedChannelId !== channel.id && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-gray-900">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className={`font-bold truncate ${selectedChannelId === channel.id ? 'text-primary-900 dark:text-primary-100' : (unread > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}`}>
                          {displayName}
                        </h3>
                        {unread > 0 && selectedChannelId !== channel.id && (
                          <span className="w-2.5 h-2.5 bg-primary-500 rounded-full shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-xs capitalize truncate ${selectedChannelId === channel.id ? 'text-primary-700 dark:text-primary-300' : (unread > 0 ? 'text-primary-600 font-medium' : 'text-gray-500 dark:text-gray-400')}`}>
                        {displayRole}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Active Chat */}
      <div className={`flex-1 flex-col bg-white dark:bg-gray-900 ${!selectedChannelId ? 'hidden md:flex' : 'flex'}`}>
        {selectedChannelId ? (
          <>
            {/* Chat Header */}
            <div className="h-20 border-b border-gray-100 dark:border-gray-800 px-6 flex items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shrink-0">
              {channels?.filter(c => c.id === selectedChannelId).map(channel => {
                const otherPerson = channel.type === 'direct' ? getOtherParticipant(channel) : null;
                const displayName = channel.type === 'direct' ? otherPerson?.full_name : channel.name;
                return (
                  <div key={channel.id} className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold mr-3 border border-primary-200 dark:border-primary-800/50">
                      {displayName?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">{displayName}</h2>
                      {channel.type === 'direct' ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Direct Message</span>
                      ) : (
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Group Chat</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-gray-950/30">
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <MessageSquare size={48} className="mb-4 text-gray-300 dark:text-gray-700" />
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages?.map((msg) => {
                  const isMe = msg.sender_id === profile?.id;
                  const isEditing = editingMsgId === msg.id;
                  const showEditButton = canEdit(msg) && !isEditing;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-xs mr-2 shrink-0 mt-4">
                          {msg.sender?.full_name?.charAt(0)}
                        </div>
                      )}
                      
                      {isMe && showEditButton && (
                        <button 
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditContent(msg.content);
                          }}
                          className="mr-2 self-center p-1.5 text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">{msg.sender?.full_name}</span>}
                        <div className={`px-5 py-3 rounded-2xl ${
                          isMe 
                            ? 'bg-primary-600 text-white rounded-tr-sm shadow-md shadow-primary-600/10' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm border border-gray-100 dark:border-gray-700 shadow-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 mx-1">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.is_edited && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">(edited)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
              {editingMsgId && (
                <div className="flex items-center justify-between mb-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-900/50">
                  <div className="flex items-center text-sm text-primary-700 dark:text-primary-400">
                    <Edit2 size={14} className="mr-2" />
                    <span>Editing message</span>
                  </div>
                  <button onClick={() => setEditingMsgId(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X size={16} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  type="text"
                  value={editingMsgId ? editContent : newMessage}
                  onChange={(e) => editingMsgId ? setEditContent(e.target.value) : setNewMessage(e.target.value)}
                  placeholder={editingMsgId ? "Edit your message..." : "Type your message..."}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 rounded-full px-6 py-3.5 text-gray-900 dark:text-white transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={(editingMsgId ? !editContent.trim() : !newMessage.trim()) || sendMessage.isPending || editMessage.isPending}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-md shrink-0 ${
                    editingMsgId 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20' 
                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20'
                  }`}
                >
                  {editingMsgId ? <Check size={20} /> : <Send size={20} className="ml-1" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 dark:bg-gray-950/50">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-primary-500 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Messages</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Select a conversation from the left to start chatting with peers, faculty, or wardens.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Start New Chat</h2>
              <button onClick={() => setIsNewChatModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearch} className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a name..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button type="submit" className="hidden">Search</button>
              </form>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {isSearching ? (
                  <p className="text-center text-sm text-gray-500 py-4">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.filter(r => r.id !== profile?.id).map((result) => (
                    <div 
                      key={result.id} 
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold mr-3">
                          {result.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{result.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{result.role?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleStartChat(result.id)}
                        className="p-2 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                        title="Start Chat"
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  ))
                ) : searchQuery ? (
                  <p className="text-center text-sm text-gray-500 py-4">No matching users found.</p>
                ) : (
                  <p className="text-center text-sm text-gray-500 py-4">Type a name and press Enter to search.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
