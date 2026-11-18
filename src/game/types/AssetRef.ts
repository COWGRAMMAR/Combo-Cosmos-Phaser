/**
 * Referensi aset hasil resolve: tekstur + frame opsional.
 * Dipakai entity dan pool supaya migrasi ke atlas spritesheet cukup mengubah
 * isi manifest, tanpa menyentuh signature constructor entity.
 */
export interface AssetRef
{
    /** Key tekstur yang sudah terdaftar di TextureManager. */
    readonly texture: string;
    /** Nama/indeks frame di dalam tekstur (kosong = frame default). */
    readonly frame?: string | number;
}
