/**
 * Kontrak satu formasi tes Grunt.
 * Formasi mengurus timer spawn sendiri memakai delta, bukan timer Phaser,
 * supaya reset cukup memanggil start() tanpa menyisakan timer yang berjalan.
 */
export interface IGruntFormation
{
    start(): void;
    update(delta: number): void;
    readonly finished: boolean;
}
