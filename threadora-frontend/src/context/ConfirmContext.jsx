import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

const ConfirmContext = createContext();

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context.confirm;
}

export function ConfirmProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'primary', // 'primary' | 'danger' | 'warning'
  });

  const resolver = useRef();

  const confirm = useCallback((options) => {
    setModal({
      isOpen: true,
      title: options.title || 'Confirm Action',
      message: options.message || 'Are you sure you want to proceed?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'primary',
    });

    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleClose = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    resolver.current(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    resolver.current(true);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-2xl flex-shrink-0 ${
                modal.type === 'danger' ? 'bg-red-500/10 text-red-500' : 
                modal.type === 'warning' ? 'bg-amber-400/10 text-amber-400' : 
                'bg-[#6366F1]/10 text-[#6366F1]'
              }`}>
                {modal.type === 'danger' ? <ShieldAlert className="w-6 h-6" /> : 
                 modal.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : 
                 <Info className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">{modal.title}</h3>
                <p className="text-[#908FA0] text-sm leading-relaxed">{modal.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#908FA0] hover:text-white hover:bg-white/5 transition-all"
              >
                {modal.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                  modal.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 
                  modal.type === 'warning' ? 'bg-amber-400 hover:bg-amber-500 text-black shadow-amber-400/20' : 
                  'bg-[#6366F1] hover:bg-[#5558E6] shadow-[#6366F1]/20'
                }`}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
