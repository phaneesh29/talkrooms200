import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import socket from '../utils/socket'
import { Loader2, Send, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from '../utils/axios'

const ChatRoom = () => {
  const { room } = useParams()
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(false)
  const [socketId, setSocketId] = useState("")
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [message, setMessage] = useState('')
  const [typingUser, setTypingUser] = useState(null)
  const typingTimeoutRef = useRef(null)

  const refreshToken = async () => {
    try {
      const response = await axios.get('/auth/refresh');
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      console.log(error)
      throw Error("Unable to refresh token");
    }
  }

  const getProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/auth/profile');
      if (response.status === 200) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await refreshToken();
          const retryResponse = await axios.get('/auth/profile');
          if (retryResponse.status === 200) {
            setUser(retryResponse.data.user);
            return retryResponse.data.user;
          }
        } catch (refreshErr) {
          console.log(refreshErr);
        }
      }
      toast.error("Unauthorized! Please login again.");
      navigate("/login")
    } finally {
      setLoading(false);
    }
  }

  const getRoomDetailsAndMessages = async () => {
    setLoading(true);
    try {
      const roomRes = await axios.get(`/room/${room}`);
      setRoomData(roomRes.data.room);

      const msgRes = await axios.get(`/chat/all/${room}`);
      setMessages(msgRes.data.messages);
      scrollToBottom();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load room");
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50)
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message?.trim()) return;
    socket.emit("sendMessage", { room: room, message: message });
    // stop typing indicator when message is sent
    emitTyping(false)
    setMessage('');
    scrollToBottom();
  }

  const emitTyping = (isTyping) => {
    socket.emit('typing', { room, isTyping })
  }

  useEffect(() => {
    // Check auth and then fetch messages
    const init = async () => {
      const userProfile = await getProfile();
      if (userProfile) {
        await getRoomDetailsAndMessages();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  useEffect(() => {
    if (!socket.connected) {
      try {
        socket.connect();
      } catch {
        // ignore
      }
    } else {
      setSocketId(socket.id);
      socket.emit("joinRoom", { room });
    }

    const onConnect = () => {
      setSocketId(socket.id);
      socket.emit("joinRoom", { room });
    };

    const handleNewMessage = (msg) => {
      // msg.room is now an ID due to our backend change. 
      // The socket event still goes to the "room code" channel.
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    };

    const handleUserJoined = ({ message }) => {
      toast(message, {
        icon: '👋',
      });
    };

    const handleTyping = ({ username, isTyping }) => {
      if (isTyping) {
        setTypingUser(username)
      } else {
        setTypingUser((prev) => (prev === username ? null : prev))
      }
    }

    const handleRoomUsers = (users) => {
      setOnlineUsers(users);
    }

    const handleError = ({ message }) => {
      toast.error(message);
      navigate('/');
    };

    socket.on("connect", onConnect);
    socket.on("userjoined", handleUserJoined);
    socket.on("roomUsers", handleRoomUsers);
    socket.on('typing', handleTyping);
    socket.on("newMessage", handleNewMessage);
    socket.on('scrollToBottom', scrollToBottom);
    socket.on('error', handleError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("userjoined", handleUserJoined);
      socket.off("roomUsers", handleRoomUsers);
      socket.off("newMessage", handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('scrollToBottom', scrollToBottom);
      socket.off('error', handleError);
      socket.emit('typing', { room, isTyping: false });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    };

  }, [room])

  if (loading || !roomData) {
    return (
      <div className="flex items-center min-h-screen justify-center text-purple-400">
        <Loader2 size={64} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-transparent">
      {/* Background elements */}
      <div className="glow-blob bg-purple-600/10 w-[500px] h-[500px] top-[-100px] left-[-100px] animate-float"></div>

      {/* Header */}
      <header className="flex-none z-10 glass-panel border-b-0 border-white/5 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg text-purple-200/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {roomData.name} <span className="ml-2 text-xs bg-purple-600/30 text-purple-200 px-2 py-1 rounded-md">Code: {roomData.code}</span>
            </h1>
            <p className="text-xs text-purple-200/50 mt-1">Logged in as <span className="text-purple-300 font-medium">{user.username}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onlineUsers.length > 0 && (
            <div className="flex -space-x-2 mr-2">
              {onlineUsers.slice(0, 3).map((u, i) => (
                <div key={u.userId || i} className="group relative w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-2 border-purple-900 flex items-center justify-center text-white text-xs font-bold transition-transform hover:-translate-y-1 cursor-pointer" style={{ zIndex: 10 - i }}>
                  {u.username.charAt(0).toUpperCase()}
                  <div className="pointer-events-none absolute top-[calc(100%+8px)] right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 backdrop-blur-sm border border-white/10 text-white font-normal text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-xl z-50 overflow-hidden">
                    {u.username}
                  </div>
                </div>
              ))}
              {onlineUsers.length > 3 && (
                <div className="group relative w-8 h-8 rounded-full bg-white/10 border-2 border-purple-900 flex items-center justify-center text-purple-200 text-xs font-bold z-0 cursor-pointer hover:bg-white/20 transition-colors">
                  +{onlineUsers.length - 3}
                  <div className="pointer-events-none absolute top-[calc(100%+8px)] right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 backdrop-blur-sm border border-white/10 text-white font-normal text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-xl z-50 overflow-hidden">
                    {`${onlineUsers.length - 3} more`}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-purple-200/40 hidden sm:block">
            ID: {socketId || 'Connecting...'}
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden w-full max-w-5xl mx-auto flex flex-col relative z-10 p-4 sm:p-6 pb-0">
        <div className="flex-1 glass-card rounded-t-3xl border-b-0 flex flex-col overflow-hidden shadow-2xl relative">

          {/* Messages */}
          <div className="chat flex-1 overflow-y-auto p-6 flex flex-col gap-6 scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400/50 mb-2">
                  <Send size={24} />
                </div>
                <h3 className="text-lg font-medium text-white">No messages yet</h3>
                <p className="text-purple-200/50 text-sm max-w-sm">Be the first to say hello in the {roomData.name} room!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender?._id === user._id;
                const showAvatar = index === 0 || messages[index - 1].sender?._id !== msg.sender?._id;

                return (
                  <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`} style={{ animationDuration: '0.3s' }}>
                    {!isMe && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-3 flex-shrink-0 mt-1 shadow-lg">
                        {msg.sender?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-11"></div>}

                    <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-5 py-3 relative group ${isMe
                      ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(124,58,237,0.2)]"
                      : "bg-white/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-tl-sm hover:bg-white/15 transition-colors"
                      }`}
                    >
                      {showAvatar && (
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <span className={`text-[11px] font-semibold tracking-wide ${isMe ? "text-purple-100/90" : "text-purple-300"}`}>
                            {isMe ? "You" : msg.sender?.username}
                          </span>
                          <span className={`text-[10px] ${isMe ? "text-purple-200/60" : "text-gray-400/80"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                      {!showAvatar && (
                        <span className={`absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isMe ? "text-purple-200/60 right-full left-auto mr-12" : "text-gray-400/80"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed relative z-10">{msg.text}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Typing Indicator & Input Area */}
          <div className="p-4 sm:p-6 bg-black/20 backdrop-blur-xl border-t border-white/5 relative">
            {typingUser && (
              <div className="absolute -top-10 left-6">
                <div className="text-xs font-medium text-purple-300/80 flex items-center gap-2 glass-panel px-4 py-2 rounded-full border border-purple-500/20">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                  {typingUser} is typing...
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-3 items-end w-full relative group">
              <div className="relative flex-1">
                <input
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    emitTyping(true)
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                    typingTimeoutRef.current = setTimeout(() => {
                      emitTyping(false)
                    }, 1200)
                  }}
                  onBlur={() => emitTyping(false)}
                  type="text"
                  placeholder="Type your message..."
                  className="w-full rounded-2xl glass-input py-4 pl-5 pr-12 text-[15px] shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim()}
                className="h-[56px] w-[56px] shrink-0 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Send size={20} className={message.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ChatRoom