'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If a module was dragged onto empty canvas, auto-add it after creation */
  pendingModuleId?: string | null;
}

export default function CreateSessionDialog({
  open,
  onOpenChange,
  pendingModuleId,
}: CreateSessionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { createSession, addModuleToSession } = useWorkspaceStore();

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleCreate = () => {
    if (!name.trim()) return;

    const sessionId = createSession(name.trim(), description.trim());

    if (pendingModuleId) {
      // Check if it's a batch of module IDs (JSON array)
      try {
        const moduleIds = JSON.parse(pendingModuleId);
        if (Array.isArray(moduleIds)) {
          moduleIds.forEach((id) => addModuleToSession(sessionId, id));
        } else {
          addModuleToSession(sessionId, pendingModuleId);
        }
      } catch {
        // Single module ID
        addModuleToSession(sessionId, pendingModuleId);
      }
    }

    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
        <Dialog.Content
          className="
            fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[420px] z-[61]
            bg-[#0F172A] border border-[#1E293B]
            rounded-xl shadow-2xl shadow-[#00FFFF]/10
            p-6
          "
        >
          <Dialog.Description className="sr-only">
            Create a new workspace session to organize modules
          </Dialog.Description>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-bold text-white font-mono tracking-wider">
              NEW SESSION
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 font-mono mb-1.5">
                SESSION NAME *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. API Development"
                className="
                  w-full px-4 py-2.5
                  bg-[#1E293B] border border-[#2D3B4F]
                  rounded-lg text-sm text-white
                  placeholder:text-gray-600
                  focus:outline-none focus:border-[#00FFFF]/50
                  transition-colors
                "
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-mono mb-1.5">
                REQUIREMENT (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述你要解决的问题..."
                rows={3}
                className="
                  w-full px-4 py-2.5
                  bg-[#1E293B] border border-[#2D3B4F]
                  rounded-lg text-sm text-white
                  placeholder:text-gray-600
                  focus:outline-none focus:border-[#00FFFF]/50
                  transition-colors resize-none
                "
              />
            </div>

            {pendingModuleId && (
              <div className="px-3 py-2 bg-[#00FFFF]/5 border border-[#00FFFF]/20 rounded-lg">
                <p className="text-xs text-[#00FFFF] font-mono">
                  Module &quot;{pendingModuleId}&quot; will be auto-added
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="
                px-4 py-2 text-sm text-gray-400
                hover:text-gray-200 transition-colors
                font-mono
              ">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="
                flex items-center gap-2 px-5 py-2
                bg-[#00FFFF]/10 border border-[#00FFFF]/30
                text-[#00FFFF] text-sm font-medium font-mono
                rounded-lg
                hover:bg-[#00FFFF]/20 hover:border-[#00FFFF]/50
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all
              "
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
