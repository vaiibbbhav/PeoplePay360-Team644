import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

type ChatbotTriggerProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export const ChatbotTrigger: React.FC<ChatbotTriggerProps> = ({ isOpen, onToggle, onClose }) => {
  // Global keyboard shortcut listener (Ctrl+J or Cmd+J to toggle, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        onToggle();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle, onClose]);

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      title="Open HR AI Assistant (Cmd+J / Ctrl+J)"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent text-accent-ink border border-accent/20 hover:opacity-95 transition-all cursor-pointer font-sans"
    >
      <div className="relative flex items-center justify-center">
        <Sparkles className="w-4 h-4" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
      </div>
      <span className="font-semibold text-xs tracking-tight">HR Assistant</span>
      <span className="hidden sm:inline-block text-[10px] font-mono opacity-75 bg-accent-ink/20 px-1.5 py-0.5 rounded ml-0.5">
        ⌘J
      </span>
    </button>
  );
};
