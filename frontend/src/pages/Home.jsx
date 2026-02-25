import React from 'react'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast';
import axios from '../utils/axios';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Loader2, LogOut, MessageSquarePlus, Globe2, Edit2, Trash2 } from 'lucide-react';
import socket from '../utils/socket'
import Modal from '../components/Modal';
import SystemStatus from '../components/SystemStatus';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({})
  const [loading, setLoading] = useState(true)
  const [roomName, setRoomName] = useState("");
  const [editingRoom, setEditingRoom] = useState(null)
  const [deletingRoom, setDeletingRoom] = useState(null)
  const [editName, setEditName] = useState("")

  const refreshToken = async () => {
    try {
      const response = await axios.get('/auth/refresh');
      if (response.status === 200) {
        return true;
      }
    } catch {
      throw Error("Unable to refresh token");
    }
  }

  const getProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/auth/profile');
      if (response.status === 200) {
        setUser(response.data.user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await refreshToken();
          const retryResponse = await axios.get('/auth/profile');
          if (retryResponse.status === 200) {
            setUser(retryResponse.data.user);
            return;
          }
        } catch (refreshErr) {
          console.log(refreshErr);
        }
      }
      toast.error("Unauthorized! Please login again.");
      navigate("/login", { state: { from: location.pathname } })
    } finally {
      setLoading(false);
    }
  }

  const [myRooms, setMyRooms] = useState([]);

  const getMyRooms = async () => {
    try {
      const response = await axios.get('/room/my-rooms');
      if (response.status === 200) {
        setMyRooms(response.data.rooms);
      }
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    getProfile().then(() => {
      getMyRooms();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center min-h-screen justify-center text-purple-400">
        <Loader2 size={64} className="animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center py-12">
      {/* Background Blobs */}
      <div className="glow-blob bg-purple-600/20 w-[600px] h-[600px] absolute top-[-200px] left-[-200px] animate-float"></div>
      <div className="glow-blob bg-blue-600/20 w-[600px] h-[600px] absolute bottom-[-200px] right-[-200px] animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-5xl px-6 relative z-10 animate-fade-in flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-card p-6 rounded-2xl w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{user.username}</span>!
            </h1>
            <p className="text-sm text-purple-200/60">{user.email}</p>
          </div>
          <div>
            <button
              onClick={async () => {
                try {
                  await axios.get('/auth/logout');
                } catch {
                  // Empty catch block
                }
                try { socket.disconnect(); } catch {
                  // ignore
                }
                navigate('/login')
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        {user.lastJoinedRoom && (
          <div className="glass-card p-4 rounded-2xl w-full flex items-center justify-between border-green-500/20 bg-green-500/5 animate-fade-in group hover:bg-green-500/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                <MessageSquarePlus size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-md mb-0.5">Jump back in!</h3>
                <p className="text-green-200/70 text-xs sm:text-sm">You were last active in <span className="font-bold text-green-300">'{user.lastJoinedRoom.name}'</span></p>
              </div>
            </div>
            <Link to={`/chat/${user.lastJoinedRoom.code}`} className="px-5 py-2.5 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/10">
              Rejoin
            </Link>
          </div>
        )}

        {myRooms.length > 0 && (
          <div className="glass-card p-6 rounded-2xl w-full">
            <h2 className="text-xl font-semibold mb-4 text-white">My Active Rooms</h2>
            <div className="flex flex-wrap gap-4">
              {myRooms.map(r => (
                <div key={r._id} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col min-w-[200px] transition-colors relative group">
                  <Link to={`/chat/${r.code}`} className="flex-1 flex flex-col cursor-pointer pb-2">
                    <span className="font-semibold text-white">{r.name}</span>
                    <span className="text-xs text-purple-200/60 mt-1">Code: {r.code}</span>
                  </Link>

                  <div className="flex flex-row gap-2 mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditName(r.name);
                        setEditingRoom(r);
                      }}
                      className="text-xs flex items-center gap-1 text-blue-300 hover:text-blue-100 bg-blue-500/10 hover:bg-blue-500/30 px-2 py-1 rounded"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeletingRoom(r);
                      }}
                      className="text-xs flex items-center gap-1 text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/30 px-2 py-1 rounded ml-auto"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals placed outside main loop */}
        <Modal isOpen={!!editingRoom} onClose={() => setEditingRoom(null)} title="Update Room">
          <form className="mt-2" onSubmit={async (e) => {
            e.preventDefault();
            if (editName && editName.trim() !== editingRoom.name) {
              try {
                await axios.put(`/room/${editingRoom._id}`, { name: editName });
                toast.success("Room updated");
                getMyRooms();
                setEditingRoom(null);
              } catch (err) {
                toast.error(err.response?.data?.message || "Failed to update room");
              }
            } else {
              setEditingRoom(null);
            }
          }}>
            <p className="text-sm text-purple-200/60 mb-4">Enter a new name for the room: {editingRoom?.name}</p>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl glass-input px-4 py-3 text-sm mb-6"
              placeholder="Room name..."
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditingRoom(null)} className="px-4 py-2 text-sm text-purple-200 hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={!editName.trim()} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-colors disabled:opacity-50">Save Changes</button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!deletingRoom} onClose={() => setDeletingRoom(null)} title="Delete Room">
          <div className="mt-2">
            <p className="text-sm text-purple-200/80 mb-6">Are you sure you want to delete room <span className="font-bold text-white">'{deletingRoom?.name}'</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingRoom(null)} className="px-4 py-2 text-sm text-purple-200 hover:text-white transition-colors">Cancel</button>
              <button onClick={async () => {
                if (deletingRoom) {
                  try {
                    await axios.delete(`/room/${deletingRoom._id}`);
                    toast.success("Room deleted");
                    getMyRooms();
                    setDeletingRoom(null);
                  } catch {
                    toast.error("Failed to delete room");
                  }
                }
              }} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/25 hover:bg-red-500 transition-colors">Delete Room</button>
            </div>
          </div>
        </Modal>

        <div className="grid gap-6 md:grid-cols-2 w-full">
          <section className="rounded-2xl glass-card p-8 group hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500/30 transition-colors">
              <Globe2 size={24} />
            </div>
            <h2 className="text-xl font-semibold text-white">Create Room</h2>
            <p className="mt-2 text-sm text-purple-200/60">Start a new private room and get a code to share with others.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (roomName.trim()) {
                try {
                  const res = await axios.post('/room', { name: roomName });
                  toast.success(`Room Created! Code: ${res.data.room.code}`);
                  navigate(`/chat/${res.data.room.code}`);
                } catch (error) {
                  toast.error(error.response?.data?.message || "Failed to create room");
                }
              }
            }} className="mt-8 flex gap-3">
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                type="text"
                placeholder="Enter room name..."
                className="w-full rounded-xl glass-input px-4 py-3 text-sm"
              />
              <button
                type="submit"
                disabled={!roomName.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Create
              </button>
            </form>
          </section>

          <section className="rounded-2xl glass-card p-8 group hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500/30 transition-colors">
              <MessageSquarePlus size={24} />
            </div>
            <h2 className="text-xl font-semibold text-white">Join Room</h2>
            <p className="mt-2 text-sm text-blue-200/60">Join an existing room by entering its unique 6-character code.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const code = e.target.roomCode.value;
              if (code.trim()) {
                navigate(`/chat/${encodeURIComponent(code.trim().toUpperCase())}`);
              }
            }} className="mt-8 flex gap-3">
              <input
                name="roomCode"
                type="text"
                placeholder="Enter room code..."
                className="w-full rounded-xl glass-input px-4 py-3 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Join
              </button>
            </form>
          </section>
        </div>

        {/* System Status Footer */}
        <SystemStatus variant="footer" />
      </div>
    </main>
  )
}

export default Home
