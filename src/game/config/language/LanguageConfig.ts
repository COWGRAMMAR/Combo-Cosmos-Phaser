import type { LanguageCode } from '../../types/Language';

/**
 * Pengaturan bahasa game: daftar bahasa yang didukung, bahasa default,
 * bahasa cadangan, dan kunci penyimpanan di browser.
 * Semua nilai di sini adalah satu-satunya sumber kebenaran; LanguageManager
 * hanya membaca, tidak menyimpan daftar bahasa sendiri.
 */
export const LanguageConfig = {
    /** Bahasa yang boleh dipilih; urutan juga dipakai saat toggle debug. */
    supportedLanguages: ['en', 'id'] as const satisfies readonly LanguageCode[],

    /** Bahasa saat tidak ada pilihan tersimpan yang valid. */
    defaultLanguage: 'en' as const satisfies LanguageCode,

    /** Bahasa cadangan saat key tidak ada di bahasa aktif. */
    fallbackLanguage: 'en' as const satisfies LanguageCode,

    /** Kunci localStorage untuk mengingat pilihan pemain. */
    storageKey: 'combo-cosmos.language'
} as const;
