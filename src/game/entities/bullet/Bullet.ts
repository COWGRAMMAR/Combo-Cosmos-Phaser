import * as Phaser from 'phaser';

/**
 * Kelas dasar semua peluru.
 * Sengaja hanya mewarisi GameObjects.Image (tanpa body fisika) supaya peluru
 * musuh tetap ringan, sementara peluru pemain bisa menambahkan body sendiri.
 */
export abstract class Bullet extends Phaser.GameObjects.Image
{
    /** Radius tabrakan peluru, disimpan terpisah dari ukuran tekstur. */
    public radius: number;

    /**
     * Menyiapkan sprite peluru dalam keadaan nonaktif.
     * Objek tidak ditambahkan ke scene di sini karena pool (Group) yang mengurus.
     */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        radius: number,
        frame?: string | number
    )
    {
        super(scene, x, y, texture, frame);

        this.radius = radius;

        this.setActive(false);
        this.setVisible(false);
    }

    /** Mengaktifkan peluru dan menempatkannya di posisi baru. */
    public activate(x: number, y: number): void
    {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
    }

    /** Mengembalikan peluru ke pool tanpa menghancurkan objeknya. */
    public deactivate(): void
    {
        this.setActive(false);
        this.setVisible(false);
    }
}
