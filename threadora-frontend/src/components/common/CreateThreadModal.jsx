import ThreadComposer from './ThreadComposer';

export default function CreateThreadModal({ isOpen, onClose, onSuccess, categoryId }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto rounded-3xl">
        <ThreadComposer 
          isModal={true} 
          onCancel={onClose} 
          onSuccess={(thread) => {
            onClose();
            if (onSuccess) onSuccess(thread);
          }}
          preselectedCategory={categoryId || ''}
        />
      </div>
    </div>
  );
}
