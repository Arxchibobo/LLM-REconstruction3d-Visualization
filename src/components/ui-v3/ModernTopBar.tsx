'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Settings,
  User,
  Box,
  Folder,
  FileCode,
  Boxes,
  UserCircle,
  Palette,
  LogOut,
  Languages,
} from 'lucide-react';
import Link from 'next/link';
import { useKnowledgeStore, VisualizationMode } from '@/stores/useKnowledgeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { getTranslation } from '@/i18n/translations';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

/**
 * 赛博朋克科技风格顶部导航栏
 * 所有按钮均有完整功能绑定
 */
export default function ModernTopBar() {
  const router = useRouter();

  const {
    searchQuery,
    setSearchQuery,
    loadKnowledgeBase,
    loadProjectStructure,
    visualizationMode,
    setVisualizationMode,
    setIsTransitioning,
  } = useKnowledgeStore();

  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const { language, toggleLanguage } = useLanguageStore();

  // UI state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Translation helper
  const t = (key: string) => getTranslation(language, key);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-menu]') && showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Auto-load knowledge base on mount
  useEffect(() => {
    const autoLoadKnowledgeBase = async () => {
      const defaultPath = 'E:\\Bobo\'s Coding cache\\.claude';
      try {
        await loadKnowledgeBase(defaultPath);
      } catch (error) {
        // silently fail - data may load from other sources
      }
    };
    autoLoadKnowledgeBase();
  }, []);

  // Data source switch with transition animation
  const handleDataSourceSwitch = async (mode: VisualizationMode) => {
    if (mode === visualizationMode) return;

    setIsTransitioning(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (mode === 'claude-config') {
      const claudePath = 'E:\\Bobo\'s Coding cache\\.claude';
      await loadKnowledgeBase(claudePath);
      setVisualizationMode('claude-config');
    } else {
      await loadProjectStructure('');
    }

    setIsTransitioning(false);
  };

  // User menu actions
  const handleOpenProfile = () => {
    setShowUserMenu(false);
    setShowProfileModal(true);
  };

  const handleOpenSettings = () => {
    setShowUserMenu(false);
    setShowSettingsModal(true);
  };

  const handleOpenThemeSettings = () => {
    setShowUserMenu(false);
    setShowSettingsModal(true);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    router.push('/login');
  };

  const userDisplayName = currentUser?.displayName ?? 'User';
  const userAvatar = currentUser?.avatar ?? 'U';
  const userAvatarColor = currentUser?.avatarColor ?? '#00FFFF';
  const userRole = currentUser?.role ?? 'viewer';

  const roleLabels: Record<string, string> = {
    admin: t('topBar.admin'),
    developer: 'Developer',
    viewer: t('topBar.viewer'),
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0F172A] border-b border-[#1E293B] shadow-lg shadow-[#00FFFF]/5 z-50">
        <div className="h-full flex items-center justify-between px-6 gap-6">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#00FFFF] to-[#FF00FF] rounded-lg shadow-lg shadow-[#00FFFF]/30">
              <Box className="w-6 h-6 text-[#0A1929]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#00FFFF]">{t('topBar.knowGraph')}</h1>
              <p className="text-xs text-gray-400">{t('topBar.subtitle')}</p>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'en-US' ? "Search nodes, Skills, MCP, Plugins..." : "搜索节点、Skills、MCP、Plugins..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-[#1E293B] border border-transparent rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/20 focus:shadow-lg focus:shadow-[#00FFFF]/10 transition-all duration-200"
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Workspace link */}
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-[#FFFF00] hover:bg-[#1E293B] rounded-md transition-all duration-200"
            >
              <Boxes className="w-3.5 h-3.5" />
              {t('topBar.workspace')}
            </Link>

            <div className="w-px h-6 bg-[#1E293B]" />

            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#FFFF00] hover:bg-[#1E293B] rounded-lg transition-all duration-200"
              title={language === 'en-US' ? 'Switch to Chinese' : '切换到英文'}
            >
              <Languages className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-[#1E293B]" />

            {/* Data source switch */}
            <div className="flex items-center bg-[#1E293B] rounded-lg p-1">
              <button
                onClick={() => handleDataSourceSwitch('claude-config')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  visualizationMode === 'claude-config'
                    ? 'bg-[#00FFFF]/20 text-[#00FFFF] shadow-sm'
                    : 'text-gray-400 hover:text-[#00FFFF]'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                {t('topBar.claudeConfig')}
              </button>
              <button
                onClick={() => handleDataSourceSwitch('project-structure')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  visualizationMode === 'project-structure'
                    ? 'bg-[#FF00FF]/20 text-[#FF00FF] shadow-sm'
                    : 'text-gray-400 hover:text-[#FF00FF]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                {t('topBar.projectStructure')}
              </button>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#00FFFF] hover:bg-[#1E293B] rounded-lg transition-all duration-200"
              title={t('topBar.settings')}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User avatar button */}
            <div className="relative" data-user-menu>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-full relative hover:ring-2 hover:ring-[#00FFFF]/30 transition-all duration-200"
                style={{ backgroundColor: userAvatarColor }}
                title={t('topBar.profile')}
              >
                <span className="text-sm font-bold text-[#0A1929]">{userAvatar}</span>
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl overflow-hidden z-50">
                  {/* User info header */}
                  <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 p-4 border-b border-[#334155]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[#0A1929]"
                        style={{ backgroundColor: userAvatarColor }}
                      >
                        {userAvatar}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{userDisplayName}</p>
                        <p className="text-xs text-gray-400">{roleLabels[userRole]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items - ALL functional */}
                  <div className="p-2">
                    <button
                      onClick={handleOpenProfile}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#00FFFF] rounded transition-colors flex items-center gap-2"
                    >
                      <UserCircle className="w-4 h-4" />
                      {t('topBar.profile')}
                    </button>
                    <button
                      onClick={handleOpenSettings}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#00FFFF] rounded transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      {t('topBar.projectSettings')}
                    </button>
                    <button
                      onClick={handleOpenThemeSettings}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#00FFFF] rounded transition-colors flex items-center gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      {t('topBar.themeSettings')}
                    </button>
                    <div className="border-t border-[#334155] my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#FF00FF] rounded transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('topBar.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </>
  );
}
