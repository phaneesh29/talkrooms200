import React from 'react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Loader2, MessageSquare, User2 } from 'lucide-react'
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
    // Attempt storage access for Safari cross-site
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="glow-blob bg-purple-600/30 w-[400px] h-[400px] top-[-100px] left-[-100px] animate-float"></div>
      <div className="glow-blob bg-blue-600/30 w-[500px] h-[500px] bottom-[-200px] right-[-100px] animate-float" style={{ animationDelay: '2s' }}></div>

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

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-card mb-4 text-purple-400">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TalkRooms200<sup style={{ fontSize: '0.4em', fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#f472b6)', color: '#fff', padding: '2px 6px', borderRadius: '6px', marginLeft: '4px', letterSpacing: '1px', verticalAlign: 'super' }}>BETA</sup></h1>
          <p className="text-purple-200/60 mt-2">Welcome back! Please sign in.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-8 space-y-6"
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
  )
}

export default Login
