import { Shield, Hammer } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#111827] border border-[rgba(255,255,255,0.05)] p-10 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#6366F1] blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#6366F1]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#6366F1]">
            <Hammer className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Under Maintenance</h1>
          <p className="text-[#908FA0] text-sm leading-relaxed mb-8">
            Threadora is currently undergoing scheduled maintenance to improve system stability and deploy new features. We'll be back online shortly!
          </p>

          <div className="bg-[#0B0F14]/50 border border-white/[0.05] rounded-xl p-4 flex items-center gap-3 text-left">
            <Shield className="w-5 h-5 text-[#6366F1]" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Status</p>
              <p className="text-sm font-medium text-white">Temporarily Offline</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
