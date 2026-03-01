import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en } from '@/locales/en';
import { zhCN } from '@/locales/zhCN';
import { zhTW } from '@/locales/zhTW';

export type LanguageCode = 'en' | 'zhCN' | 'zhTW';

const locales = {
    en,
    zhCN,
    zhTW,
};

interface I18nState {
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
}

export const useI18nStore = create<I18nState>()(
    persist(
        (set) => ({
            lang: 'en', // 默认语言
            setLang: (lang) => set({ lang }),
        }),
        {
            name: 'i18n-storage', // 保存到 localStorage
        }
    )
);

/**
 * Hook: 用于在组件获取当前语言的翻译函数。
 * 这样写能确保 lang 变化时组件会触发重新渲染以更新文字。
 */
export function useTranslation() {
    const lang = useI18nStore((state) => state.lang);
    const setLang = useI18nStore((state) => state.setLang);

    const t = (key: keyof typeof en) => {
        const dict = locales[lang] || locales.en;
        return dict[key] || key;
    };

    return { t, lang, setLang };
}
