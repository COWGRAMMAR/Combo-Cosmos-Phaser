/** Satu entri kantong: nilai yang dimasukkan dan berapa kali nilainya disalin. */
export interface ShuffleBagEntry<T>
{
    /** Nilai yang dimasukkan ke kantong. */
    value: T;
    /** Jumlah salinan nilai tersebut; nilai <= 0 diabaikan. */
    count: number;
}

/**
 * Kantong kelereng generik untuk pengambilan acak tanpa pengembalian.
 * Semua kelereng diambil satu per satu sampai habis, lalu pemanggil mengisi ulang
 * kantong agar distribusi tetap merata dalam satu putaran penuh.
 */
export class ShuffleBag<T>
{
    private readonly items: T[] = [];

    /**
     * Mengisi kantong dengan daftar entri baru.
     * Entri dengan count <= 0 dilewati sehingga config boleh mematikan sebuah nilai.
     */
    public refill(entries: ReadonlyArray<ShuffleBagEntry<T>>): void
    {
        for (const entry of entries)
        {
            for (let i = 0; i < entry.count; i++)
            {
                this.items.push(entry.value);
            }
        }
    }

    /** Mengambil satu nilai acak; mengembalikan null jika kantong kosong. */
    public draw(): T | null
    {
        if (this.items.length === 0)
        {
            return null;
        }

        const index = Math.floor(Math.random() * this.items.length);
        const value = this.items[index];
        const last = this.items.pop() as T;

        // Swap-remove: nilai terakhir dipindah ke lubang bekas nilai yang diambil,
        // sehingga pengambilan tetap O(1) tanpa menggeser seluruh array.
        if (index < this.items.length)
        {
            this.items[index] = last;
        }

        return value;
    }

    /** Jumlah kelereng yang masih tersisa di kantong. */
    public get size(): number
    {
        return this.items.length;
    }

    /** Mengosongkan kantong tanpa mengubah referensi objeknya. */
    public clear(): void
    {
        this.items.length = 0;
    }
}
