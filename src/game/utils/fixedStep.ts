/**
 * Utility loop waktu tetap (fixed timestep) untuk logika gameplay.
 * Mencegah spiral of death saat frame lonjak besar dengan membatasi jumlah langkah per frame
 * dan membuang sisa akumulasi yang melebihi satu langkah penuh.
 */
import { TimeConfig } from '../config/TimeConfig';

/**
 * Jalankan sejumlah langkah waktu tetap dalam satu frame, lalu kembalikan sisa akumulasi.
 * @param accumulatorMs Akumulasi delta waktu saat ini (milidetik).
 * @param delta Delta waktu frame ini (milidetik).
 * @param fixedStepMs Durasi satu langkah tetap (milidetik).
 * @param maxAccumulatorMs Batas maksimal akumulasi delta.
 * @param maxStepsPerFrame Batas jumlah langkah yang dijalankan dalam satu frame.
 * @param runStep Fungsi yang dipanggil tiap langkah dengan argumen fixedStepMs.
 * @returns Sisa akumulasi waktu setelah semua langkah selesai.
 */
export function runFixedSteps(
    accumulatorMs: number,
    delta: number,
    fixedStepMs: number,
    maxAccumulatorMs: number,
    maxStepsPerFrame: number,
    runStep: (fixedStepMs: number) => void
): number
{
    let accumulator = Math.min(accumulatorMs + delta, maxAccumulatorMs);

    let steps = 0;
    while (accumulator >= fixedStepMs && steps < maxStepsPerFrame)
    {
        runStep(fixedStepMs);
        accumulator -= fixedStepMs;
        steps++;
    }

    // Buang sisa akumulasi yang melebihi satu langkah penuh agar tidak menumpuk ke frame berikutnya.
    if (accumulator >= fixedStepMs)
    {
        accumulator %= fixedStepMs;
    }

    return accumulator;
}

/**
 * Jalankan loop fixed-step menggunakan nilai default dari TimeConfig.
 * @param accumulatorMs Akumulasi delta waktu saat ini (milidetik).
 * @param delta Delta waktu frame ini (milidetik).
 * @param runStep Fungsi yang dipanggil tiap langkah dengan argumen TimeConfig.fixedStepMs.
 * @returns Sisa akumulasi waktu setelah semua langkah selesai.
 */
export function runFixedStepsWithTimeConfig(
    accumulatorMs: number,
    delta: number,
    runStep: (fixedStepMs: number) => void
): number
{
    return runFixedSteps(
        accumulatorMs,
        delta,
        TimeConfig.fixedStepMs,
        TimeConfig.maxAccumulatorMs,
        TimeConfig.maxStepsPerFrame,
        runStep
    );
}
