'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, DEMO_USERS } from '@/stores/useAuthStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { getTranslation } from '@/i18n/translations';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loginError, clearError } = useAuthStore();
  const { language } = useLanguageStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Translation helper
  const t = (key: string) => getTranslation(language, key);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/v3');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 300));

    const success = login(username.trim(), password);
    if (success) {
      router.replace('/v3');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    clearError();
  };

  return (
    <div className="min-h-screen bg-[#0A1929] flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #00FFFF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow effects */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-[120px]" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#FF00FF]/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-[#00FFFF] to-[#FF00FF] rounded-2xl shadow-lg shadow-[#00FFFF]/30 mb-4">
            <Box className="w-9 h-9 text-[#0A1929]" />
          </div>
          <h1 className="text-2xl font-bold text-[#00FFFF]">KnowGraph</h1>
          <p className="text-sm text-gray-400 mt-1">{t('topBar.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl shadow-[#00FFFF]/5 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 px-6 py-4 border-b border-[#1E293B]">
            <h2 className="text-lg font-semibold text-white">{t('login.title')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('login.subtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError();
                }}
                placeholder={t('login.usernamePlaceholder')}
                className="w-full h-10 px-3 bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF]/30 transition-all"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full h-10 px-3 pr-10 bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#00FFFF] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {loginError && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0A1929] font-semibold text-sm rounded-lg hover:from-[#00FFFF] hover:to-[#00FFFF] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00FFFF]/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#0A1929] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {t('login.loginButton')}
                </>
              )}
            </button>
          </form>

          {/* Quick login section */}
          <div className="px-6 pb-6">
            <div className="border-t border-[#1E293B] pt-4">
              <p className="text-xs text-gray-500 mb-3">{t('login.quickLogin')}</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user.username, user.password)}
                    className="flex flex-col items-center gap-1.5 p-3 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] hover:border-[#00FFFF]/30 rounded-lg transition-all group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#0A1929] font-bold text-sm"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.avatar}
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-[#00FFFF] transition-colors">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {user.role === 'admin'
                        ? t('topBar.admin')
                        : user.role === 'developer'
                          ? 'Developer'
                          : t('topBar.viewer')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          KnowGraph v3.0 &middot; Cyberpunk Edition
        </p>
      </div>
    </div>
  );
}
