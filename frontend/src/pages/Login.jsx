import React from 'react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Loader2, MessageSquare, User2, Zap, Shield, Globe, Users } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router'
import axios from '../utils/axios'
import Modal from '../components/Modal'

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({
    identifier: "",
    password: ""
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConsent, setShowConsent] = useState(false)

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value })
  }

  const proceedWithLogin = async () => {
    if (document.hasStorageAccess && document.requestStorageAccess) {
      try {
        const hasAccess = await document.hasStorageAccess();
        if (!hasAccess) {
          await document.requestStorageAccess();
        }
      } catch (err) {
        console.warn("Storage access denied", err);
      }
    }

    setLoading(true)
    try {
      const response = await axios.post('/auth/login', user)
      if (response.status === 200) {
        toast.success(response.data.message)
        const from = location.state?.from || '/'
        navigate(from)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const hasConsent = localStorage.getItem('cookieConsent') === 'true';
    if (!hasConsent) {
      setShowConsent(true);
      return;
    }
    proceedWithLogin()
  }

  const handleAcceptCookies = async () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowConsent(false);
    await proceedWithLogin();
  }

  const handleDeclineCookies = () => {
    setShowConsent(false);
    toast.error("Cookie permission is required to log in.");
  }

  const features = [
    { icon: Zap, title: 'Real-time Messaging', desc: 'Instant delivery with zero lag' },
    { icon: Shield, title: 'Private Rooms', desc: 'Secure, invite-only conversations' },
    { icon: Globe, title: 'Cross-platform', desc: 'Works on any device, anywhere' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <Modal isOpen={showConsent} onClose={handleDeclineCookies} title="Cookie Consent">
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-purple-100/80 leading-relaxed font-medium">
            To ensure a secure and persistent authentication session, TalkRooms200 requires permission to set cookies. This is particularly necessary for browsers with strict privacy controls, such as Safari.
          </p>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <button onClick={handleDeclineCookies} className="px-5 py-2.5 text-sm font-medium text-purple-200/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10">
              Decline
            </button>
            <button onClick={handleAcceptCookies} className="px-5 py-2.5 text-sm font-semibold bg-white text-black hover:bg-gray-200 rounded-xl shadow-lg transition-colors">
              Accept Cookies
            </button>
          </div>
        </div>
      </Modal>

      {/* ── LEFT HERO PANEL ── */}
      <div className="hidden md:flex md:w-[48%] lg:w-[52%] auth-hero-gradient relative flex-col justify-center items-center px-10 lg:px-16 overflow-hidden select-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="auth-particle"
            style={{
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-3 mb-8 animate-slide-up" style={{ '--stagger': '0ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <MessageSquare size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              TalkRooms200<sup style={{ fontSize: '0.4em', fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#f472b6)', color: '#fff', padding: '2px 6px', borderRadius: '6px', marginLeft: '4px', letterSpacing: '1px', verticalAlign: 'super' }}>BETA</sup>
            </span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4 animate-slide-up" style={{ '--stagger': '80ms' }}>
            Where conversations
            <span className="block shimmer-text">come alive.</span>
          </h2>
          <p className="text-purple-100/60 text-base mb-10 leading-relaxed animate-slide-up" style={{ '--stagger': '160ms' }}>
            Create private rooms, chat in real-time, and connect with people that matter — all for free.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="auth-feature-card flex items-center gap-4 p-4 rounded-xl animate-slide-up" style={{ '--stagger': `${240 + i * 100}ms` }}>
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-purple-300 shrink-0">
                  <f.icon size={20} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-purple-200/50 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 animate-slide-up" style={{ '--stagger': '600ms' }}>
            <div className="flex -space-x-2">
              {['bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-emerald-500'].map((bg, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-[#0c0a1d] flex items-center justify-center`}>
                  <Users size={12} className="text-white/80" />
                </div>
              ))}
            </div>
            <p className="text-purple-200/50 text-sm">
              Join users already chatting on TalkRooms200
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="w-full md:w-[52%] lg:w-[48%] flex flex-col items-center justify-center px-6 sm:px-10 py-12 relative">
        <div className="glow-blob bg-purple-600/20 w-[350px] h-[350px] top-[-100px] right-[-100px] animate-float"></div>
        <div className="glow-blob bg-blue-600/15 w-[400px] h-[400px] bottom-[-150px] left-[-100px] animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile-only compact header */}
          <div className="md:hidden text-center mb-8 animate-slide-up" style={{ '--stagger': '0ms' }}>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center text-purple-400">
                <MessageSquare size={20} />
              </div>
              <span className="text-xl font-bold text-white">
                TalkRooms200<sup style={{ fontSize: '0.4em', fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#f472b6)', color: '#fff', padding: '2px 5px', borderRadius: '5px', marginLeft: '3px', letterSpacing: '1px', verticalAlign: 'super' }}>BETA</sup>
              </span>
            </div>
            <p className="text-purple-200/50 text-sm">Real-time private rooms. Free forever.</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block mb-8 animate-slide-up" style={{ '--stagger': '100ms' }}>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back</h1>
            <p className="text-purple-200/60">Sign in to continue to your rooms.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl p-8 space-y-6 animate-slide-up"
            style={{ '--stagger': '200ms' }}
          >
            <div className="space-y-4">
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="identifier"
                  value={user.identifier}
                  onChange={handleChange}
                  placeholder="Username or Email"
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-xl glass-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={user.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl glass-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link className='text-purple-400 font-semibold hover:text-purple-300 transition-colors' to="/register" state={{ from: location.state?.from }}>
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
