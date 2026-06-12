import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Shield, Bell, Clock, CheckCircle2, Users, Building2,
  Zap, MessageSquare, BarChart3, Droplet, Lightbulb, Car, Trash2, Lamp,
  Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function LandingPage() {
  const [view, setView] = useState('login') 
  
  const [tab, setTab] = useState('citizen')
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    phone: '', 
    address: '' 
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { login } = useAuth() 
  const nav = useNavigate()

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

  // Helper to completely clear the form
  const clearForm = () => {
    setForm({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '' })
    setError('')
  }

  // NEW: Handler for action buttons that require authentication
  const handleAuthRequiredAction = () => {
    toast.error('Please login or register to access this feature.', {
      icon: '🔒',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    setView('login');
    setShowPassword(false);
    setShowConfirmPassword(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (view === 'login') {
        const r = await login(form.email, form.password, tab)

        if (!r.success) {
          setError(r.error)
          return
        }

        toast.success('Welcome back!')
        clearForm() 
        setShowPassword(false)
        
        nav(tab === 'admin' ? '/admin' : tab === 'officer' ? '/officer' : '/citizen')
        
      } else if (view === 'register') {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
            address: form.address
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Account created successfully! Please sign in.')
          setView('login')
          clearForm()
          setShowPassword(false)
          setShowConfirmPassword(false)
        } else {
          setError(data.error || 'Registration failed.')
        }
        
      } else if (view === 'forgot') {
        toast.success('Please enter your new password.')
        setView('reset')
        setForm({ ...form, password: '', confirmPassword: '' }) 
        setShowPassword(false)
        setShowConfirmPassword(false)
        
      } else if (view === 'reset') {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match.')
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            role: tab 
          })
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Password reset successfully! Please sign in with your new password.')
          setView('login')
          clearForm()
          setShowPassword(false)
          setShowConfirmPassword(false)
        } else {
          setError(data.error || 'Failed to reset password.')
        }
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Complaints Resolved', value: '12,450+', icon: CheckCircle2 },
    { label: 'Active Citizens', value: '50,000+', icon: Users },
    { label: 'Avg Resolution Time', value: '48 hrs', icon: Clock },
    { label: 'Departments', value: '15+', icon: Building2 }
  ]

  const features = [
    { title: 'AI-Powered Processing', desc: 'Automatic complaint summarization and intelligent categorization.', icon: Zap },
    { title: 'Real-time Notifications', desc: 'Stay updated with alerts at every status change.', icon: Bell },
    { title: 'Auto-Generated Replies', desc: 'Instant acknowledgment and estimated resolution times.', icon: MessageSquare },
    { title: 'Analytics Dashboard', desc: 'Track complaint trends and department performance metrics.', icon: BarChart3 }
  ]

  const categories = [
    { name: 'Water Supply', icon: Droplet, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { name: 'Electricity', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { name: 'Road Maintenance', icon: Car, color: 'text-gray-300', bg: 'bg-gray-500/20' },
    { name: 'Sanitation', icon: Trash2, color: 'text-green-400', bg: 'bg-green-500/20' },
    { name: 'Street Lighting', icon: Lamp, color: 'text-orange-400', bg: 'bg-orange-500/20' }
  ]

  const cardTitle = 
    view === 'login' ? 'Welcome Back' : 
    view === 'register' ? 'Create an Account' : 
    view === 'forgot' ? 'Forgot Password' :
    'Reset Password'
    
  const cardSubtitle = 
    view === 'login' ? 'Sign in to your account' : 
    view === 'register' ? 'Register to file and track grievances' : 
    view === 'forgot' ? 'Enter your email to reset your password' :
    'Enter and confirm your new password'

  return (
    <div className="relative min-h-screen w-full font-sans">
      
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/your-background-video.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 flex flex-col min-h-screen">
        
        <nav className="sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-white font-bold leading-none">Grievance Portal</h1>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Smart Public Services</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#categories" className="hover:text-white transition-colors">Categories</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-3">
              {/* UPDATED: Nav Track Complaint Button */}
              <button 
                onClick={handleAuthRequiredAction}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
              >
                Track Complaint
              </button>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setView('login');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                  clearForm(); 
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login / Register
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-1">
          <section className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              <div>
                <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 px-3 py-1.5 rounded-full mb-6">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-xs font-bold uppercase tracking-wider">AI-Enabled Platform</span>
                </div>
                
                <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
                  Smart Public Grievance <br />
                  Redressal Portal
                </h2>
                
                <p className="text-gray-200 text-lg mb-8 max-w-lg drop-shadow-md font-medium">
                  Report public service issues efficiently. Our AI-powered system ensures quick processing, transparent tracking, and timely resolution of your complaints.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  {/* UPDATED: File a Complaint Button */}
                  <button 
                    onClick={handleAuthRequiredAction}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                  >
                    File a Complaint <span className="text-lg">→</span>
                  </button>
                  {/* UPDATED: Track Status Button */}
                  <button 
                    onClick={handleAuthRequiredAction}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium rounded-lg transition-colors shadow-lg"
                  >
                    Track Status
                  </button>
                </div>
                
                
              </div>

              <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 transition-all duration-300">
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white">{cardTitle}</h3>
                    <p className="text-gray-300 text-sm mt-1">{cardSubtitle}</p>
                  </div>

                  {(view === 'login' || view === 'register') && (
                    <div className="flex border-b border-white/20 mb-6">
                      {['citizen', 'officer', 'admin'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setTab(r);
                            setShowPassword(false);
                            setShowConfirmPassword(false);
                            clearForm();
                          }}
                          className={`flex-1 pb-3 text-sm font-semibold capitalize transition-all border-b-2 ${
                            tab === r ? 'border-blue-400 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {view === 'register' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter your name"
                          value={form.name}
                          onChange={set('name')}
                          className="w-full px-4 py-2.5 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                        />
                      </div>
                    )}

                    {view !== 'reset' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Email</label>
                        <input
                          type="email"
                          required
                          placeholder="Enter your email"
                          value={form.email}
                          onChange={set('email')}
                          className="w-full px-4 py-2.5 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                        />
                      </div>
                    )}

                    {view !== 'forgot' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                          {view === 'reset' ? 'New Password' : 'Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder={view === 'reset' ? "Enter new password" : "Enter your password"}
                            value={form.password}
                            onChange={set('password')}
                            className="w-full px-4 py-2.5 pr-10 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {view === 'login' && (
                          <div className="flex justify-end mt-1">
                            <button 
                              type="button" 
                              onClick={() => {
                                setView('forgot');
                                setShowPassword(false);
                                setShowConfirmPassword(false);
                                clearForm(); 
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
                            >
                              Forgot password?
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {view === 'reset' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="Confirm new password"
                            value={form.confirmPassword}
                            onChange={set('confirmPassword')}
                            className="w-full px-4 py-2.5 pr-10 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                          />
                           <button
                            type="button"
                            onClick={toggleConfirmPasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {view === 'register' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Phone</label>
                          <input
                            type="tel"
                            required
                            placeholder="Phone number"
                            value={form.phone}
                            onChange={set('phone')}
                            className="w-full px-4 py-2.5 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Address</label>
                          <input
                            type="text"
                            required
                            placeholder="Your address"
                            value={form.address}
                            onChange={set('address')}
                            className="w-full px-4 py-2.5 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                          />
                        </div>
                      </>
                    )}
                    
                    {error && <p className="text-red-400 text-xs font-medium text-center">{error}</p>}

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all mt-2 disabled:opacity-70"
                    >
                      {loading 
                        ? 'Please wait...' 
                        : view === 'login' ? 'Sign In' 
                        : view === 'register' ? 'Create Account' 
                        : view === 'forgot' ? 'Continue'
                        : 'Reset Password'
                      }
                    </button>
                  </form>

                  <div className="mt-5 text-center">
                    {view === 'login' && (
                      <p className="text-gray-300 text-xs">
                        Don't have an account?{' '}
                        <button 
                          type="button" 
                          onClick={() => {
                            setView('register');
                            setShowPassword(false);
                            clearForm(); 
                          }} 
                          className="text-blue-400 font-bold hover:text-blue-300 hover:underline"
                        >
                          Register
                        </button>
                      </p>
                    )}
                    {view === 'register' && (
                      <p className="text-gray-300 text-xs">
                        Already have an account?{' '}
                        <button 
                          type="button" 
                          onClick={() => {
                            setView('login');
                            setShowPassword(false);
                            setShowConfirmPassword(false);
                            clearForm(); 
                          }} 
                          className="text-blue-400 font-bold hover:text-blue-300 hover:underline"
                        >
                          Sign In
                        </button>
                      </p>
                    )}
                    {(view === 'forgot' || view === 'reset') && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setView('login');
                          setShowPassword(false);
                          setShowConfirmPassword(false);
                          clearForm(); 
                        }} 
                        className="text-blue-400 text-xs font-bold hover:text-blue-300 hover:underline"
                      >
                        Back to Login
                      </button>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </section>

          <section id="features" className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white drop-shadow-md mb-3">Powerful Features</h3>
              <p className="text-gray-300 drop-shadow">Everything you need to manage public grievances efficiently</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((item, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-lg hover:-translate-y-1 transition-transform">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="categories" className="max-w-7xl mx-auto px-6 py-16 mb-10">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white drop-shadow-md mb-3">Service Categories</h3>
              <p className="text-gray-300 drop-shadow">File complaints across all major public services</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-8 rounded-xl shadow-lg flex flex-col items-center gap-3 w-40 hover:scale-105 transition-transform cursor-pointer">
                  <div className={`w-12 h-12 ${cat.bg} rounded-full flex items-center justify-center`}>
                    <cat.icon className={`w-6 h-6 ${cat.color}`} />
                  </div>
                  <span className="text-sm font-bold text-white text-center">{cat.name}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-6 text-center text-sm font-medium text-gray-400 mt-auto">
          © 2026 Smart Grievance Redressal Portal · Government of India
        </footer>
      </div>
    </div>
  )
}