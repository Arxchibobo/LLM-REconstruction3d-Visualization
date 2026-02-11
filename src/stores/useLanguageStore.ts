import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en-US' | 'zh-CN';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en-US', // Default to English

      setLanguage: (lang: Language) => {
        set({ language: lang });
      },

      toggleLanguage: () => {
        set((state) => ({
          language: state.language === 'en-US' ? 'zh-CN' : 'en-US'
        }));
      },
    }),
    {
      name: 'language-storage',
    }
  )
);
