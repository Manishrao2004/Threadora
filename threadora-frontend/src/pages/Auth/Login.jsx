import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errorUtils';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    
    setIsSubmitting(true);
    try {
      const data = await login({ email, password });
      toast.success('Successfully logged in!');
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid email or password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      const data = await googleLogin(credentialResponse.credential);
      toast.success('Successfully logged in with Google!');
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Google Auth failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0B0F14]">
      {/* Stitch Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6366F1]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#22D3EE]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent mb-2">
              Threadora
            </h1>
          </Link>
          <p className="text-[#C7C4D7] font-medium tracking-wide text-sm opacity-80">
            Welcome back to the professional circle.
          </p>
        </div>

        <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-md rounded-xl p-8 shadow-[0px_24px_48px_rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)]">
          <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
            <div className="space-y-2">
              <label className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#C7C4D7] ml-1">
                Identity
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#908FA0] group-focus-within:text-[#C0C1FF] transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12" 
                  placeholder="Email address"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#C7C4D7]">
                  Key
                </label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#908FA0] group-focus-within:text-[#C0C1FF] transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12" 
                  placeholder="Secure password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#908FA0] hover:text-[#C0C1FF] transition-colors focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-[8px]"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Stitch Google Auth Methods Placeholder */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="w-full border-t border-white/5"></div>
              <span className="absolute bg-[#181C21] px-4 text-[0.6875rem] text-[#908FA0] font-medium uppercase tracking-widest rounded-full">
                Or Connect via
              </span>
            </div>
            
            <div className="flex justify-center w-full min-h-[44px]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error('Google Auth Failed');
                }}
                theme="filled_black"
                shape="rectangular"
                width="100%"
                text="continue_with"
                size="large"
              />
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[#C7C4D7]">
            New to the platform?{' '}
            <Link to="/register" className="text-[#C0C1FF] font-semibold hover:underline decoration-[#C0C1FF]/30 underline-offset-4 ml-1 transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
