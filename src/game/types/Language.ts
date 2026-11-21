/** Kode bahasa yang didukung game; sengaja dibatasi supaya fallback tetap sederhana. */
export type LanguageCode = 'en' | 'id';

/** Nilai pengganti placeholder `{nama}` pada teks terjemahan. */
export type TranslationParams = Record<string, string | number>;

/** Kumpulan pasangan key bertitik → teks untuk satu bahasa. */
export type TranslationTable = Record<string, string>;
