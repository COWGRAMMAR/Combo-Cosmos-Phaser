/**
 * Semua jenis power-up yang bisa didapat pemain.
 * Ditempatkan di lapisan types agar config dan systems bisa memakainya
 * tanpa saling bergantung (config hanya boleh mengimpor types).
 */
export enum PowerUpType
{
    /** Menambah jumlah jalur tembakan pemain. */
    Lane = 'lane',

    /** Menaikkan kecepatan tembakan untuk sementara. */
    AtkSpeed = 'atk-speed',

    /** Memberi perisai yang menahan satu tembakan. */
    Shield = 'shield',

    /** Mengaktifkan laser jalur untuk sementara. */
    Laser = 'laser',

    /** Menghapus seluruh peluru musuh di layar. */
    Bomb = 'bomb',

    /** Menambah satu nyawa pemain. */
    Life = 'life'
}
