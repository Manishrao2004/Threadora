import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldOff } from 'lucide-react';

export default function TrustBadge({ credibilityScore, isSuspended }) {
  if (isSuspended) {
    return (
      <span title="Suspended User" className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-wide flex-shrink-0">
        <ShieldOff className="w-3 h-3" /> <span className="hidden sm:inline">Suspended</span>
      </span>
    );
  }

  const score = credibilityScore || 0;

  if (score >= 20) {
    return (
      <span title="Highly Trusted Contributor" className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20 uppercase tracking-wide flex-shrink-0">
        <ShieldCheck className="w-3 h-3" /> <span className="hidden sm:inline">Highly Trusted</span>
      </span>
    );
  } else if (score >= 5) {
    return (
      <span title="Trusted Contributor" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20 uppercase tracking-wide flex-shrink-0">
        <ShieldCheck className="w-3 h-3" /> <span className="hidden sm:inline">Trusted</span>
      </span>
    );
  } else if (score < -10) {
    return (
      <span title="Warning: Low Credibility" className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 uppercase tracking-wide flex-shrink-0">
        <AlertTriangle className="w-3 h-3" /> <span className="hidden sm:inline">Warning</span>
      </span>
    );
  } else if (score < 0) {
    return (
      <span title="Questionable Credibility" className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 uppercase tracking-wide flex-shrink-0">
        <ShieldAlert className="w-3 h-3" /> <span className="hidden sm:inline">Questionable</span>
      </span>
    );
  }
  
  return null;
}
