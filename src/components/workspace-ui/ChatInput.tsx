'use client';

import { useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

interface ChatInputProps {
  sessionId: string;
}

export default function ChatInput({ sessionId }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const draft = useWorkspaceStore((s) => s.chatInputDraft[sessionId] || '');
  const processing = useWorkspaceStore((s) => s.chatProcessing);
  const setChatInputDraft = useWorkspaceStore((s) => s.setChatInputDraft);
  const sendMessage = useWorkspaceStore((s) => s.sendMessage);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || processing) return;
    sendMessage(sessionId, trimmed);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [draft, processing, sessionId, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setChatInputDraft(sessionId, e.target.value);
      // Auto-resize
      const ta = e.target;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
    },
    [sessionId, setChatInputDraft],
  );

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[#1E293B] bg-[#0F172A]/80">
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Describe your requirement..."
        rows={1}
        disabled={processing}
        className="
          flex-1 px-3 py-2
          bg-[#1E293B] border border-[#2D3B4F]
          rounded-lg text-sm text-gray-200
          placeholder:text-gray-600
          focus:outline-none focus:border-[#FF00FF]/50
          transition-colors resize-none
          disabled:opacity-50
        "
        style={{ maxHeight: '80px' }}
      />
      <button
        onClick={handleSend}
        disabled={!draft.trim() || processing}
        className="
          p-2 rounded-lg
          bg-[#FF00FF]/20 border border-[#FF00FF]/30
          text-[#FF00FF]
          hover:bg-[#FF00FF]/30 hover:border-[#FF00FF]/50
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all flex-shrink-0
        "
      >
        {processing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
