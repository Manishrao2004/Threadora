import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Network, 
  Copy, 
  BadgeCheck, 
  LogIn, 
  ArrowRight, 
  Code, 
  Github 
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="bg-[#0B0F14] text-[#E5E7EB] font-['Inter'] min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-[100vw] z-50 glass-panel flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent">
            Threadora
          </span>
          <div className="hidden md:flex gap-6 items-center">
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="font-semibold tracking-tight text-sm text-[#6366F1] hover:text-[#8083FF] transition-colors cursor-pointer"
            >
              Features
            </a>
            <Link to="/dashboard" className="font-semibold tracking-tight text-sm text-gray-400 hover:text-white transition-colors">
              Explore
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary text-sm px-5 py-2">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors block mr-2">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2">
                Join Platform
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          {/* Clean Professional Gradient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-900/10 blur-[120px] rounded-full -z-10"></div>
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[300px] bg-slate-900/20 blur-[100px] rounded-full -z-10"></div>
          
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight">
              Professional Information <br />
              <span className="bg-gradient-to-r from-[#6366F1] via-[#3B82F6] to-[#22D3EE] bg-clip-text text-transparent">Curation Network</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
              A high-performance environment for structured knowledge sharing. Threadora integrates advanced moderation with streamlined information architecture.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary px-8 py-4 text-lg w-full sm:w-auto">
                  Enter Network Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary px-8 py-4 text-lg">
                    Start Curating
                  </Link>
                  <Link to="/dashboard" className="btn-secondary px-8 py-4 text-lg">
                    Explore Global Feed
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Bento Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold mb-4">Core Specialties of Threadora</h2>
            <p className="text-gray-400">Engineered for quality, precision, and verified knowledge exchange.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Smart Moderation */}
            <div className="glass-panel p-8 rounded-xl space-y-6 card-hover group">
              <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center group-hover:bg-[#6366F1]/20 transition-colors">
                <ShieldCheck className="w-6 h-6 text-[#6366F1]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">1. Smart Moderation System</h3>
                <ul className="text-gray-400 text-sm leading-relaxed space-y-2">
                  <li className="flex items-start gap-2"><span className="text-[#6366F1] text-xs mt-1">🔹</span> Detects spam, toxic, and low-quality content early</li>
                  <li className="flex items-start gap-2"><span className="text-[#6366F1] text-xs mt-1">🔹</span> Reduces dependency on delayed human moderation</li>
                  <li className="flex items-start gap-2"><span className="text-[#6366F1] text-xs mt-1">🔹</span> Keeps discussions clean and meaningful</li>
                </ul>
              </div>
            </div>

            {/* Structured Discussions */}
            <div className="glass-panel p-8 rounded-xl space-y-6 card-hover group">
              <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/10 flex items-center justify-center group-hover:bg-[#22D3EE]/20 transition-colors">
                <Network className="w-6 h-6 text-[#22D3EE]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">2. Structured Discussions (No Chaos Threads)</h3>
                <ul className="text-gray-400 text-sm leading-relaxed space-y-2">
                  <li className="flex items-start gap-2"><span className="text-[#22D3EE] text-xs mt-1">🔹</span> Conversations are organized in clear thread hierarchy</li>
                  <li className="flex items-start gap-2"><span className="text-[#22D3EE] text-xs mt-1">🔹</span> Avoids messy and confusing comment chains</li>
                  <li className="flex items-start gap-2"><span className="text-[#22D3EE] text-xs mt-1">🔹</span> Improves readability and understanding</li>
                </ul>
              </div>
            </div>

            {/* Duplicate Detection */}
            <div className="glass-panel p-8 rounded-xl space-y-6 card-hover group">
              <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center group-hover:bg-[#3B82F6]/20 transition-colors">
                <Copy className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">3. Duplicate Content Detection</h3>
                <ul className="text-gray-400 text-sm leading-relaxed space-y-2">
                  <li className="flex items-start gap-2"><span className="text-[#3B82F6] text-xs mt-1">🔹</span> Identifies repeated questions/posts</li>
                  <li className="flex items-start gap-2"><span className="text-[#3B82F6] text-xs mt-1">🔹</span> Suggests existing discussions instead of creating clutter</li>
                  <li className="flex items-start gap-2"><span className="text-[#3B82F6] text-xs mt-1">🔹</span> Maintains a clean knowledge base</li>
                </ul>
              </div>
            </div>

            {/* Credibility */}
            <div className="glass-panel p-8 rounded-xl space-y-6 card-hover group">
              <div className="w-12 h-12 rounded-xl bg-[#8083FF]/10 flex items-center justify-center group-hover:bg-[#8083FF]/20 transition-colors">
                <BadgeCheck className="w-6 h-6 text-[#8083FF]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">4. Credibility-Based Interaction</h3>
                <ul className="text-gray-400 text-sm leading-relaxed space-y-2">
                  <li className="flex items-start gap-2"><span className="text-[#8083FF] text-xs mt-1">🔹</span> Users are evaluated based on activity and quality of contributions</li>
                  <li className="flex items-start gap-2"><span className="text-[#8083FF] text-xs mt-1">🔹</span> Helps highlight trustworthy answers</li>
                  <li className="flex items-start gap-2"><span className="text-[#8083FF] text-xs mt-1">🔹</span> Reduces misinformation impact</li>
                </ul>
              </div>
            </div>



          </div>
        </section>

        {/* Final CTA Section */}
        <section className="max-w-5xl mx-auto px-6 py-32 text-center relative z-10">
          <div className="glass-panel rounded-3xl p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900/10 blur-[80px] rounded-full"></div>
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Begin Curating with <span className="bg-gradient-to-r from-[#6366F1] via-[#3B82F6] to-[#22D3EE] bg-clip-text text-transparent">Threadora</span></h2>
              <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">Join the next evolution of online discussion. Experience a platform built for clarity, structure, and meaningful engagement.</p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn-primary px-10 py-4 text-lg">
                    Return to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary px-10 py-4 text-lg">
                      Register with Network
                    </Link>
                    <Link to="/dashboard" className="btn-secondary px-10 py-4 text-lg">
                      Explore as Guest
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-4 flex-1">
          <span className="text-xl font-bold bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent">Threadora</span>
          <p className="text-gray-500 text-xs tracking-widest uppercase">Crafted by Manishrao2004</p>
        </div>
        <div className="flex gap-8 text-sm text-gray-400 flex-1 justify-center">
          {/* GitHub source code repo */}
          <a 
            className="hover:text-white transition-colors flex items-center gap-2 text-gray-400" 
            href="https://github.com/Manishrao2004/Threadora"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Code className="w-4 h-4" />
            Source Code
          </a>
        </div>
        <div className="flex gap-4 flex-1 justify-end">
          <a className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors" href="https://github.com/Manishrao2004" target="_blank" rel="noopener noreferrer" title="GitHub: Manishrao2004">
            <Github className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
          </a>
        </div>
      </footer>
    </div>
  );
}
