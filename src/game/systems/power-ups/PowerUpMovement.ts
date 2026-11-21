import * as Phaser from 'phaser';
import { PowerUpConfig } from '../../config/PowerUpConfig';
import { ShuffleBag } from '../../utils/ShuffleBag';
import type { ShuffleBagEntry } from '../../utils/ShuffleBag';

/** Id pola gerak yang tersedia, diturunkan dari tabel rentang di config. */
export type PowerUpMovementId = keyof typeof PowerUpConfig.movement.ranges;

/** Parameter gerak hasil roll untuk satu item power-up. */
export interface PowerUpMovementParams
{
    /** Kecepatan jatuh dasar, piksel per detik. */
    speed: number;
    /** Amplitudo offset horizontal, piksel. */
    amp: number;
    /** Amplitudo offset vertikal (hanya pola infinity), piksel. */
    ampY: number;
    /** Frekuensi sudut gerak, radian per detik. */
    freq: number;
    /** Sudut arah diagonal pola straight, derajat; 0 untuk pola lain. */
    angleDeg: number;
}

/** Fungsi murni satu pola gerak: umur (detik) + parameter → offset lokal. */
export type PowerUpMovementFn = (
    ageSec: number,
    params: PowerUpMovementParams
) => { dx: number; dy: number };

/** Rentang [min,max] satu parameter gerak. */
interface MovementRange
{
    readonly min: number;
    readonly max: number;
}

/** Rentang parameter yang tersedia per pola; field yang tidak dipakai dianggap 0. */
interface MovementRanges
{
    readonly speed?: MovementRange;
    readonly amp?: MovementRange;
    readonly ampY?: MovementRange;
    readonly freq?: MovementRange;
    readonly angle?: MovementRange;
}

/**
 * Registry pola gerak.
 * Menambah pola baru cukup menambah satu fungsi di sini, satu entri bobot kantong,
 * dan satu entri rentang di PowerUpConfig.movement.ranges.
 */
const MOVEMENTS: Record<PowerUpMovementId, PowerUpMovementFn> = {
    // Jatuh diagonal: sudut hasil roll menentukan arah, kecepatan total tetap sama dengan speed.
    straight: (ageSec, params) => {
        const rad = Phaser.Math.DegToRad(params.angleDeg);
        const distance = params.speed * ageSec;

        // dy dikoreksi (cos - 1) agar posisi akhir = base + v*t*(sin θ, cos θ), bukan v*t + dy.
        return {
            dx: Math.sin(rad) * distance,
            dy: (Math.cos(rad) - 1) * distance
        };
    },

    // Ayun kiri-kanan; vertikal tetap mengikuti kecepatan jatuh dasar.
    sine: (ageSec, params) => ({
        dx: Math.sin(ageSec * params.freq) * params.amp,
        dy: 0
    }),

    // Bentuk 8: vertikal berayun dua kali lebih cepat dari horizontal.
    infinity: (ageSec, params) => ({
        dx: Math.sin(ageSec * params.freq) * params.amp,
        dy: Math.sin(ageSec * params.freq * 2) * params.ampY
    })
};

/** Kantong pola bersama seluruh item; tidak menyimpan state per item. */
const patternBag = new ShuffleBag<PowerUpMovementId>();

/** Mengisi kantong pola sesuai komposisi di config. */
function refillPatternBag(): void
{
    const counts = PowerUpConfig.movement.patternBagCounts;
    const entries: ShuffleBagEntry<PowerUpMovementId>[] = [
        { value: 'straight', count: counts.straight },
        { value: 'sine', count: counts.sine },
        { value: 'infinity', count: counts.infinity }
    ];

    patternBag.refill(entries);
}

/** Mengambil id pola berikutnya dari kantong; kantong diisi ulang saat habis. */
export function pickMovementId(): PowerUpMovementId
{
    if (patternBag.size === 0)
    {
        refillPatternBag();
    }

    // Selama config punya minimal satu kelereng, kantong pasti terisi setelah refill.
    return patternBag.draw() ?? 'straight';
}

/** Roll satu nilai acak dari rentang; 0 jika pola tidak memakai parameter tersebut. */
function rollRange(range: MovementRange | undefined): number
{
    if (!range)
    {
        return 0;
    }

    return range.min + Math.random() * (range.max - range.min);
}

/** Roll seluruh parameter gerak untuk satu pola. */
export function rollMovementParams(id: PowerUpMovementId): PowerUpMovementParams
{
    const ranges: MovementRanges = PowerUpConfig.movement.ranges[id];

    return {
        speed: rollRange(ranges.speed),
        amp: rollRange(ranges.amp),
        ampY: rollRange(ranges.ampY),
        freq: rollRange(ranges.freq),
        angleDeg: rollRange(ranges.angle)
    };
}

/** Hitung offset pola untuk umur tertentu (detik). Satu-satunya jalur akses registry. */
export function computeMovementOffset(
    id: PowerUpMovementId,
    ageSec: number,
    params: PowerUpMovementParams
): { dx: number; dy: number }
{
    return MOVEMENTS[id](ageSec, params);
}

/**
 * Validasi config gerak sekali saat spawn manager dibuat.
 * Melempar error jika kantong pola kosong atau bentuk infinity tidak akan terlihat
 * karena ayunan vertikalnya lebih lambat dari kecepatan jatuh.
 */
export function validateMovementConfig(): void
{
    const counts = PowerUpConfig.movement.patternBagCounts;
    const totalCount = counts.straight + counts.sine + counts.infinity;

    if (totalCount <= 0)
    {
        throw new Error('PowerUpConfig.movement: kantong pola tidak boleh kosong.');
    }

    const straight = PowerUpConfig.movement.ranges.straight;

    // Rentang sudut wajib melingkupi 0 derajat agar arah lurus ke bawah tetap mungkin muncul.
    if (straight.angle.min > 0 || straight.angle.max < 0)
    {
        throw new Error('PowerUpConfig.movement: rentang sudut straight harus melingkupi 0 derajat.');
    }

    const infinity = PowerUpConfig.movement.ranges.infinity;

    // Bentuk 8 hanya terlihat kalau gelombang vertikal cukup cepat dibanding jatuh.
    if (2 * infinity.ampY.min * infinity.freq.min <= infinity.speed.max)
    {
        throw new Error('PowerUpConfig.movement: syarat 2 * ampY.min * freq.min > speed.max tidak terpenuhi.');
    }
}
