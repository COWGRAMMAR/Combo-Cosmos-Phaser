/** Jenis power-up yang tersedia dalam permainan. */
export enum PowerUpBuffType {
    /** Tambah satu jalur tembakan permanen (max 5). */
    Lane = 'lane',
    /** Menembak lebih cepat selama durasi. */
    AtkSpeed = 'atk-speed',
    /** Kebal semua peluru musuh selama durasi. */
    Shield = 'shield',
    /** Laser lurus ke depan, matikan tembakan biasa. */
    Laser = 'laser',
    /** Bom instan: damage semua musuh + clear peluru musuh. */
    Nuke = 'nuke',
    /** Tambah satu nyawa. */
    Life = 'life'
}