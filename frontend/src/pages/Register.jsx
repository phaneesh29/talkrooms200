import React from 'react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Loader2, User2, MessageSquare, Sparkles, CreditCard, Clock, Users } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router'
import axios from '../utils/axios'

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: ""
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post('/auth/register', user)
      if (response.status === 201) {
        toast.success(response.data.message)
        navigate('/login', { state: { from: location.state?.from } })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Sparkles, title: 'Instant Setup', desc: 'Create your account in under 30 seconds' },
    { icon: CreditCard, title: 'No Credit Card', desc: 'Completely free, no strings attached' },
    { icon: Clock, title: 'Free Forever', desc: 'No trials, no hidden fees, ever' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── LEFT HERO PANEL ── */}
      <div className="hidden md:flex md:w-[48%] lg:w-[52%] auth-hero-gradient-alt relative flex-col justify-center items-center px-10 lg:px-16 overflow-hidden select-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="auth-particle-alt"
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
              TalkRooms200<sup style={{ fontSize: '0.4em', fontWeight: 700, background: 'linear-gradient(135deg,#60a5fa,#34d399)', color: '#fff', padding: '2px 6px', borderRadius: '6px', marginLeft: '4px', letterSpacing: '1px', verticalAlign: 'super' }}>BETA</sup>
            </span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4 animate-slide-up" style={{ '--stagger': '80ms' }}>
            Get started
            <span className="block shimmer-text-blue">in seconds.</span>
          </h2>
          <p className="text-blue-100/60 text-base mb-10 leading-relaxed animate-slide-up" style={{ '--stagger': '160ms' }}>
            Create your free account and start chatting instantly. No credit card, no setup hassle — just jump in.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="auth-feature-card-alt flex items-center gap-4 p-4 rounded-xl animate-slide-up" style={{ '--stagger': `${240 + i * 100}ms` }}>
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                  <f.icon size={20} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-blue-200/50 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 animate-slide-up" style={{ '--stagger': '600ms' }}>
            <div className="flex -space-x-2">
              {['bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-teal-500'].map((bg, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-[#08101d] flex items-center justify-center`}>
                  <Users size={12} className="text-white/80" />
                </div>
              ))}
            </div>
            <p className="text-blue-200/50 text-sm">
              Join users already chatting on TalkRooms200
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="w-full md:w-[52%] lg:w-[48%] flex flex-col items-center justify-center px-6 sm:px-10 py-12 relative">
        <div className="glow-blob bg-blue-600/20 w-[350px] h-[350px] top-[-100px] right-[-100px] animate-float"></div>
        <div className="glow-blob bg-emerald-600/15 w-[400px] h-[400px] bottom-[-150px] left-[-100px] animate-float" style={{ animationDelay: '1.5s' }}></div>

        <div className="w-full max-w-md relative z-10">
          <div className="md:hidden text-center mb-8 animate-slide-up" style={{ '--stagger': '0ms' }}>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center text-blue-400">
                <MessageSquare size={20} />
              </div>
              <span className="text-xl font-bold text-white">
                TalkRooms200<sup style={{ fontSize: '0.4em', fontWeight: 700, background: 'linear-gradient(135deg,#60a5fa,#34d399)', color: '#fff', padding: '2px 5px', borderRadius: '5px', marginLeft: '3px', letterSpacing: '1px', verticalAlign: 'super' }}>BETA</sup>
              </span>
            </div>
            <p className="text-blue-200/50 text-sm">Free forever. No credit card needed.</p>
          </div>

          <div className="hidden md:block mb-8 animate-slide-up" style={{ '--stagger': '100ms' }}>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create Account</h1>
            <p className="text-blue-200/60">Sign up for free — takes under 30 seconds.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl p-8 space-y-6 animate-slide-up"
            style={{ '--stagger': '200ms' }}
          >
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={user.username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setUser({ ...user, username: val });
                    }}
                    placeholder="Username"
                    pattern="^[a-z0-9]+$"
                    title="Only lowercase letters and numbers allowed. No special characters."
                    required
                    className="w-full pl-10 pr-3 py-3 rounded-xl glass-input"
                  />
                </div>
                <p className="text-xs text-purple-200/40 mt-1.5 pl-1">Lowercase letters and numbers only</p>
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  placeholder="Email Address"
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
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Registering...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link className='text-blue-400 font-semibold hover:text-blue-300 transition-colors' to="/login">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
