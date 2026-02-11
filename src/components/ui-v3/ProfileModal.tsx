'use client';

import { useState } from 'react';
import { X, User, Shield, Calendar, Save, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { getTranslation } from '@/i18n/translations';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, updateProfile } = useAuthStore();
  const { language } = useLanguageStore();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName ?? '');
  const [saved, setSaved] = useState(false);

  // Translation helper
  const t = (key: string) => getTranslation(language, key);

  if (!isOpen || !currentUser) return null;

  const handleSaveName = () => {
    if (newName.trim() && newName.trim() !== currentUser.displayName) {
      updateProfile({ displayName: newName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setEditingName(false);
  };

  const roleLabels: Record<string, string> = {
    admin: t('profile.roleAdmin'),
    developer: 'Developer',
    viewer: t('profile.roleViewer'),
  };

  const roleColors: Record<string, string> = {
    admin: '#FF00FF',
    developer: '#00FFFF',
    viewer: '#FFFF00',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl shadow-[#00FFFF]/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 border-b border-[#1E293B]">
          <h2 className="text-lg font-semibold text-white">{t('profile.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-[#0A1929] shadow-lg"
              style={{
                backgroundColor: currentUser.avatarColor,
                boxShadow: `0 0 20px ${currentUser.avatarColor}40`,
              }}
            >
              {currentUser.avatar}
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 h-8 px-2 bg-[#1E293B] border border-[#334155] rounded text-sm text-white focus:outline-none focus:border-[#00FFFF]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setEditingName(false);
                        setNewName(currentUser.displayName);
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 text-[#00FFFF] hover:bg-[#00FFFF]/10 rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {currentUser.displayName}
                  </h3>
                  {saved && <Check className="w-4 h-4 text-green-400" />}
                  <button
                    onClick={() => {
                      setEditingName(true);
                      setNewName(currentUser.displayName);
                    }}
                    className="text-xs text-gray-500 hover:text-[#00FFFF] transition-colors"
                  >
                    {t('common.edit')}
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-400">@{currentUser.username}</p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            {/* Role */}
            <div className="flex items-center gap-3 p-3 bg-[#1E293B] rounded-lg">
              <Shield className="w-4 h-4" style={{ color: roleColors[currentUser.role] }} />
              <div className="flex-1">
                <p className="text-xs text-gray-500">{t('profile.role')}</p>
                <p className="text-sm font-medium" style={{ color: roleColors[currentUser.role] }}>
                  {roleLabels[currentUser.role]}
                </p>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-center gap-3 p-3 bg-[#1E293B] rounded-lg">
              <User className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">{t('profile.username')}</p>
                <p className="text-sm font-mono text-gray-300">{currentUser.id}</p>
              </div>
            </div>

            {/* Joined date */}
            <div className="flex items-center gap-3 p-3 bg-[#1E293B] rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">{t('profile.joinedAt')}</p>
                <p className="text-sm text-gray-300">{currentUser.joinedAt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E293B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-lg transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
