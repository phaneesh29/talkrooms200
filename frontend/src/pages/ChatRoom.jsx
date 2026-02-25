import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import socket from '../utils/socket'
import { Loader2, Send, ArrowLeft, Mic, MicOff, Phone, PhoneOff, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from '../utils/axios'
import SystemStatus from '../components/SystemStatus'

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

  // -- WebRTC & Voice State --
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]); // List of users currently in voice
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // socketId -> RTCPeerConnection
  const audioElementsRef = useRef({}); // socketId -> <audio> element reference

  // Audio Context for Chimes
  const playChime = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'join') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'leave') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.1); // A3
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("AudioContext not supported or blocked");
    }
  };

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

  // --- WebRTC Core Functions ---

  const STUN_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  const cleanupVoice = () => {
    // 1. Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => {
      pc.close();
    });
    peerConnectionsRef.current = {};

    // 2. Stop all local tracks (turn off mic)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // 3. Remove all audio elements
    Object.values(audioElementsRef.current).forEach(audio => {
      if (audio) {
        audio.srcObject = null;
        audio.remove();
      }
    });
    audioElementsRef.current = {};

    setInVoice(false);
    setIsMuted(false);
    setVoiceUsers([]);
    socket.emit("leaveVoice", { room });
  };

  const createPeerConnection = (targetSocketId) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnectionsRef.current[targetSocketId] = pc;

    // Add local stream tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates generated by WebRTC
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", {
          candidate: event.candidate,
          to: targetSocketId
        });
      }
    };

    // Handle incoming audio tracks from the remote peer
    pc.ontrack = (event) => {
      let audio = audioElementsRef.current[targetSocketId];
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        // Don't append to DOM unless necessary, keeping it in memory is usually fine for Audio
        audioElementsRef.current[targetSocketId] = audio;
      }
      if (audio.srcObject !== event.streams[0]) {
        audio.srcObject = event.streams[0];
      }
    };

    // Clean up if connection closes naturally
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        const audio = audioElementsRef.current[targetSocketId];
        if (audio) {
          audio.srcObject = null;
          delete audioElementsRef.current[targetSocketId];
        }
        delete peerConnectionsRef.current[targetSocketId];
      }
    };

    return pc;
  };

  const handleJoinVoice = async () => {
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setInVoice(true);
      setIsMuted(false);

      // 2. Tell the server we want to join
      socket.emit("joinVoice", { room });
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      toast.error("Could not access microphone.");
    }
  };

  const handleLeaveVoice = () => {
    cleanupVoice();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

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
      playChime('join');
    };

    const handleTyping = ({ username, isTyping }) => {
      if (isTyping) {
        setTypingUser(username)
      } else {
        setTypingUser((prev) => (prev === username ? null : prev))
      }
    }

    const handleRoomUsers = (users) => {
      setOnlineUsers((prev) => {
        // Play leave chime if someone left (and it's not the initial load)
        if (prev.length > 0 && users.length < prev.length) {
          playChime('leave');
        }
        return users;
      });
      // Filter out users who are explicitly marked as inVoice
      const vUsers = users.filter(u => u.inVoice);
      setVoiceUsers(vUsers);
    }

    const handleError = ({ message }) => {
      toast.error(message);
      navigate('/');
    };

    // --- WebRTC Socket Event Handlers ---

    // Server rejected our join attempt (e.g. room full)
    const handleVoiceError = ({ message }) => {
      toast.error(message);
      cleanupVoice();
    };

    // Another user joined voice. Since we are already in voice, 
    // WE will initiate the connection to THEM.
    const handleUserJoinedVoice = async ({ socketId, username }) => {
      if (!localStreamRef.current) return; // We aren't in voice ourselves

      toast.success(`${username} joined voice`);
      const pc = createPeerConnection(socketId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc-offer", { offer, to: socketId });
    };

    // Another user (who was already in voice) leaves
    const handleUserLeftVoice = ({ socketId }) => {
      const pc = peerConnectionsRef.current[socketId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[socketId];
      }
      const audio = audioElementsRef.current[socketId];
      if (audio) {
        audio.srcObject = null;
        delete audioElementsRef.current[socketId];
      }
    };

    // We received an SDP Offer from someone else
    const handleWebRTCOffer = async ({ offer, from }) => {
      if (!localStreamRef.current) return; // We aren't in voice

      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc-answer", { answer, to: from });
    };

    // We received an SDP Answer to an Offer we sent
    const handleWebRTCAnswer = async ({ answer, from }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    // We received an ICE candidate to help establish the connection
    const handleWebRTCICECandidate = async ({ candidate, from }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    };

    // ------------------------------------

    socket.on("connect", onConnect);
    socket.on("userjoined", handleUserJoined);
    socket.on("roomUsers", handleRoomUsers);
    socket.on('typing', handleTyping);
    socket.on("newMessage", handleNewMessage);
    socket.on('scrollToBottom', scrollToBottom);
    socket.on('error', handleError);

    // WebRTC Listeners
    socket.on("voiceError", handleVoiceError);
    socket.on("userJoinedVoice", handleUserJoinedVoice);
    socket.on("userLeftVoice", handleUserLeftVoice);
    socket.on("webrtc-offer", handleWebRTCOffer);
    socket.on("webrtc-answer", handleWebRTCAnswer);
    socket.on("webrtc-ice-candidate", handleWebRTCICECandidate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("userjoined", handleUserJoined);
      socket.off("roomUsers", handleRoomUsers);
      socket.off("newMessage", handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('scrollToBottom', scrollToBottom);
      socket.off('error', handleError);

      socket.off("voiceError", handleVoiceError);
      socket.off("userJoinedVoice", handleUserJoinedVoice);
      socket.off("userLeftVoice", handleUserLeftVoice);
      socket.off("webrtc-offer", handleWebRTCOffer);
      socket.off("webrtc-answer", handleWebRTCAnswer);
      socket.off("webrtc-ice-candidate", handleWebRTCICECandidate);

      socket.emit('typing', { room, isTyping: false });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      // We do NOT call cleanupVoice() here natively unless the component unmounts entirely,
      // but if the component unmounts, we should clean up.
      cleanupVoice();
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
      <header className="flex-none z-10 glass-panel border-b-0 border-white/5 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-3 sm:gap-4">
        {/* Top/Left Section */}
        <div className="flex items-start sm:items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-lg text-purple-200/60 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <SystemStatus variant="dot" />
                <span className="truncate max-w-[150px] sm:max-w-[200px]">{roomData.name}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-purple-200/50 mt-0.5 sm:mt-1 truncate">Logged in as <span className="text-purple-300 font-medium">{user.username}</span></p>
            </div>
          </div>

          {/* Mobile-only Online Users (top right) */}
          {onlineUsers.length > 0 && (
            <div className="flex -space-x-1.5 sm:hidden shrink-0 items-center mt-1">
              {onlineUsers.slice(0, 3).map((u, i) => (
                <div key={u.userId || i} className={`relative w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border ${u.inVoice ? 'border-green-400' : 'border-purple-900'} flex items-center justify-center text-white text-[9px] font-bold`} style={{ zIndex: 10 - i }}>
                  {u.username.charAt(0).toUpperCase()}
                  {u.inVoice && <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5 border border-purple-900"><Mic size={6} /></div>}
                </div>
              ))}
              {onlineUsers.length > 3 && (
                <div className="relative w-6 h-6 rounded-full bg-white/10 border border-purple-900 flex items-center justify-center text-purple-200 text-[9px] font-bold z-0">
                  +{onlineUsers.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom/Right Section */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-4">

          {/* Room Code Badge */}
          <div className="flex items-center bg-purple-600/30 text-purple-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md shrink-0">
            <span className="text-[10px] sm:text-xs mr-1.5 font-mono">Code: {roomData.code}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Join link copied!");
              }}
              className="hover:text-white transition-colors p-1 rounded-sm hover:bg-white/10"
              title="Copy Join Link"
            >
              <Copy size={12} className="sm:w-[14px] sm:h-[14px]" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Voice Chat Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!inVoice ? (
                <button
                  onClick={handleJoinVoice}
                  className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all text-xs sm:text-sm font-medium"
                >
                  <Phone size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Join Voice</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-2 py-1.5 rounded-xl">
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button
                    onClick={handleLeaveVoice}
                    className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 px-2 sm:px-3 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <PhoneOff size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">Leave</span>
                  </button>
                </div>
              )}
            </div>

            {/* Desktop-only Online Users */}
            {onlineUsers.length > 0 && (
              <div className="hidden sm:flex -space-x-2">
                {onlineUsers.slice(0, 3).map((u, i) => (
                  <div key={u.userId || i} className={`group relative w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-2 ${u.inVoice ? 'border-green-400' : 'border-purple-900'} flex items-center justify-center text-white text-xs font-bold transition-transform hover:-translate-y-1 cursor-pointer`} style={{ zIndex: 10 - i }}>
                    {u.username.charAt(0).toUpperCase()}
                    {u.inVoice && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border border-purple-900"><Mic size={8} /></div>}
                    <div className="pointer-events-none absolute top-[calc(100%+8px)] right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 backdrop-blur-sm border border-white/10 text-white font-normal text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-xl z-50 overflow-hidden">
                      {u.username} {u.inVoice ? '(In Voice)' : ''}
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
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden w-full max-w-5xl mx-auto flex flex-col relative z-10 p-2 sm:p-6 pb-0">

        {/* Voice Chat Active Participant Bar (Only show if someone is in voice) */}
        {voiceUsers.length > 0 && (
          <div className="mb-4 bg-purple-900/40 border border-purple-500/20 backdrop-blur-md rounded-2xl flex items-center p-3 px-5 shadow-lg max-w-full overflow-x-auto no-scrollbar gap-4">
            <div className="flex items-center gap-2 text-green-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-semibold tracking-wide">Voice Active ({voiceUsers.length}/6)</span>
            </div>
            <div className="h-6 w-[1px] bg-purple-500/30 mx-2 shrink-0"></div>
            <div className="flex gap-3 items-center">
              {voiceUsers.map(vu => (
                <div key={vu.userId} className="flex items-center gap-2 bg-black/30 rounded-full pl-1 pr-3 py-1 border border-white/5 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {vu.username.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-purple-100">{vu.userId === user._id.toString() ? 'You' : vu.username}</span>
                  <Mic size={12} className={vu.isMuted ? "text-red-400" : "text-green-400"} />
                </div>
              ))}
            </div>
          </div>
        )
        }

        <div className="flex-1 glass-card rounded-t-3xl border-b-0 flex flex-col overflow-hidden shadow-2xl relative">

          {/* Messages */}
          <div className="chat flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 scroll-smooth">
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

                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 relative group ${isMe
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
                  className="w-full rounded-2xl glass-input py-3 sm:py-4 pl-4 sm:pl-5 pr-12 text-[14px] sm:text-[15px] shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim()}
                className="h-[48px] w-[48px] sm:h-[56px] sm:w-[56px] shrink-0 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Send size={20} className={message.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
              </button>
            </form>
          </div>
        </div>
      </main >
    </div >
  )
}

export default ChatRoom