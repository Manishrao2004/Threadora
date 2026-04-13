import { useState } from 'react';
import { submitReport } from '../../api/reportApi';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  { value: 'spam',        label: 'Spam / Promotion' },
  { value: 'harassment', label: 'Harassment / Toxicity' },
  { value: 'illegal',    label: 'Illegal Content' },
  { value: 'other',      label: 'Other' },
];

/**
 * ReportModal
 * Fullscreen modal for reporting a thread or comment.
 *
 * @param {boolean}  isOpen       - Controls visibility
 * @param {Function} onClose      - Called when modal should close
 * @param {{ type: 'thread'|'comment', id: string }} target
 * @param {string}   threadId     - Parent thread ID (required when type='comment')
 */
export default function ReportModal({ isOpen, onClose, target, threadId }) {
  const [reason, setReason]   = useState('spam');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !target) return null;

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = { reason, message: message.trim() };
      if (target.type === 'thread') {
        payload.threadId = target.id;
      } else {
        payload.commentId = target.id;
        payload.threadId  = threadId;
      }
      await submitReport(payload);
      toast.success('Report submitted successfully.');
      setReason('spam');
      setMessage('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason('spam');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="glass-panel p-6 rounded-2xl w-full max-w-sm relative z-10 animate-fade-in shadow-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-2">
          Report {target.type === 'thread' ? 'Thread' : 'Comment'}
        </h3>
        <p className="text-sm text-[#908FA0] mb-4">
          Help us keep Threadora safe. Select a reason and optionally describe the issue.
        </p>

        {/* Reason selector */}
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-[#181C21] text-white border border-white/10 rounded-xl px-3 py-2.5 text-sm mb-3 outline-none focus:ring-1 focus:ring-[#ffb4ab] transition-all"
        >
          {REPORT_REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        {/* Optional message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us more about this issue (optional)…"
          rows={3}
          className="w-full bg-[#181C21] text-white border border-white/10 rounded-xl px-3 py-2.5 text-sm mb-5 outline-none focus:ring-1 focus:ring-[#ffb4ab] resize-none transition-all placeholder-[#908FA0]"
        />

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 btn-secondary py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-[#93000a] to-[#ffb4ab] text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#93000a]/20 disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
