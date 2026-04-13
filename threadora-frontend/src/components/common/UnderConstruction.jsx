import React from 'react';
import { Wrench } from 'lucide-react';

export default function UnderConstruction({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-gray-400 glass-panel rounded-3xl min-h-[400px]">
      <div className="p-4 rounded-full bg-[#6366F1]/10 mb-6">
        <Wrench className="w-12 h-12 text-[#6366F1]" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title || 'Under Construction'}</h2>
      <p className="text-sm">This admin module is currently being built.</p>
    </div>
  );
}
