import type * as Phaser from 'phaser';
import { GameEvents } from '../config/GameEvents';
import { LanguageConfig } from '../config/language/LanguageConfig';
import enTable from '../config/language/en.json';
import idTable from '../config/language/id.json';
import type { LanguageCode, TranslationParams, TranslationTable } from '../types/Language';

/** Hanya satu instance manager untuk seluruh game; dibuat saat pertama dibutuhkan. */
let cachedManager: LanguageManager | undefined;

/**
 * Sumber tunggal bahasa aktif: menerjemahkan key, menyimpan pilihan pemain,
 * dan mengumumkan perubahan lewat event global.
 * Manager ini tidak mengenal scene maupun alat debug; pemanggil yang menyediakan emitter.
 */
export class LanguageManager
{
    private readonly tables: Record<LanguageCode, TranslationTable> = {
        en: enTable,
        id: idTable
    };

    private currentLanguage: LanguageCode;

    private eventEmitter?: Phaser.Events.EventEmitter;

    private constructor()
    {
        // Pilihan tersimpan dibaca sekali saat start; nilai rusak/tidak dikenal jatuh ke default.
        this.currentLanguage = LanguageManager.readStoredLanguage();
    }

    /** Mengambil instance tunggal, membuatnya kalau belum ada. */
    public static getInstance(): LanguageManager
    {
        if (cachedManager === undefined)
        {
            cachedManager = new LanguageManager();
        }

        return cachedManager;
    }

    /** Menyimpan emitter global supaya perubahan bahasa bisa diumumkan ke semua scene. */
    public attachEvents(emitter: Phaser.Events.EventEmitter): void
    {
        this.eventEmitter = emitter;
    }

    /** Menerjemahkan key dengan rantai fallback: bahasa aktif → fallback → key mentah. */
    public t(key: string, params?: TranslationParams): string
    {
        const active = this.tables[this.currentLanguage][key];
        const fallback = this.tables[LanguageConfig.fallbackLanguage][key];
        const template = LanguageManager.pickFirstFilled(active, fallback) ?? key;

        return LanguageManager.fillParams(template, params);
    }

    /** Kode bahasa yang sedang aktif. */
    public getLanguage(): LanguageCode
    {
        return this.currentLanguage;
    }

    /**
     * Mengganti bahasa aktif: validasi → simpan → umumkan.
     * Mengembalikan false kalau kode tidak didukung atau sama dengan bahasa sekarang,
     * sehingga pemanggil bisa membedakan "berubah" dari "tidak ada yang berubah".
     */
    public setLanguage(language: LanguageCode): boolean
    {
        if (!LanguageManager.isSupportedLanguage(language) || language === this.currentLanguage)
        {
            return false;
        }

        this.currentLanguage = language;
        this.persistLanguage(language);
        this.eventEmitter?.emit(GameEvents.LANGUAGE_CHANGED, language);

        return true;
    }

    /** Berpindah ke bahasa berikutnya pada daftar dukungan; dipakai tombol debug. */
    public toggleLanguage(): LanguageCode
    {
        const supported = LanguageConfig.supportedLanguages;
        const currentIndex = supported.indexOf(this.currentLanguage);
        const next = supported[(currentIndex + 1) % supported.length];

        this.setLanguage(next);

        return this.currentLanguage;
    }

    /** Membaca bahasa tersimpan; akses storage yang gagal tidak boleh mematikan game. */
    private static readStoredLanguage(): LanguageCode
    {
        try
        {
            const stored = window.localStorage.getItem(LanguageConfig.storageKey);

            if (stored !== null && LanguageManager.isSupportedLanguage(stored))
            {
                return stored;
            }
        }
        catch
        {
            // Storage bisa diblokir (mode privat/kebijakan browser); pakai bahasa default.
        }

        return LanguageConfig.defaultLanguage;
    }

    /** Menyimpan pilihan pemain; kegagalan storage diabaikan supaya game tetap jalan. */
    private persistLanguage(language: LanguageCode): void
    {
        try
        {
            window.localStorage.setItem(LanguageConfig.storageKey, language);
        }
        catch
        {
            // Sama seperti pembacaan: gagal simpan bukan alasan menghentikan permainan.
        }
    }

    /** Memastikan kode dari luar (storage/argumen) benar-benar bahasa yang didukung. */
    private static isSupportedLanguage(value: string): value is LanguageCode
    {
        return (LanguageConfig.supportedLanguages as readonly string[]).includes(value);
    }

    /** Melewati teks kosong supaya string kosong dianggap "tidak ada terjemahan". */
    private static pickFirstFilled(...candidates: Array<string | undefined>): string | undefined
    {
        for (const candidate of candidates)
        {
            if (candidate !== undefined && candidate !== '')
            {
                return candidate;
            }
        }

        return undefined;
    }

    /**
     * Mengganti placeholder `{nama}` dengan nilai params.
     * Placeholder tanpa nilai dibiarkan apa adanya agar teks tidak pernah bolong.
     */
    private static fillParams(template: string, params?: TranslationParams): string
    {
        if (params === undefined)
        {
            return template;
        }

        return template.replace(/\{(\w+)\}/g, (placeholder: string, name: string) => {
            const value = params[name];

            return value === undefined ? placeholder : String(value);
        });
    }
}
