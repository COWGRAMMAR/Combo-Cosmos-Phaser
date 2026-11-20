/**
 * Nilai konfigurasi untuk sistem power-up, dibagi per domain sesuai siklus hidup item:
 * render (tampilan) → item (aturan inventory & umur) → spawn (cara muncul) → movement (jalur gerak).
 * Semua angka dan pengaturan terkait ada di sini, bukan di file implementasi
 * (scenes, entities, systems).
 */
export const PowerUpConfig = {
    /** Domain tampilan item power-up: warna, ukuran, alpha, depth, dan peta ikon. */
    render: {
        /** Warna lingkaran item power-up (hex). */
        itemColor: 0xffd700,

        /** Radius lingkaran item power-up, dalam piksel. */
        itemRadius: 12,

        /** Alpha lingkaran item power-up. */
        itemAlpha: 0.9,

        /** Depth rendering lingkaran item power-up. */
        itemDepth: 50,

        /** Alpha item saat tidak bisa diambil karena inventory tidak menerimanya. */
        blockedAlpha: 0.4,

        /** Warna placeholder ikon per jenis buff (hex). Digunakan AssetManager untuk menggambar lingkaran placeholder. */
        iconColor: {
            'atk-speed': 0x7df9ff,
            shield: 0x4da6ff,
            lane: 0xff8c00,
            laser: 0x8a2be2,
            nuke: 0xff0000,
            life: 0x00ff00
        },

        /** Kunci aset ikon placeholder per jenis buff (nama properti AssetKeys). Digunakan UI untuk menampilkan ikon yang konsisten. */
        iconKey: {
            'atk-speed': 'powerup-icon-atk-speed',
            shield: 'powerup-icon-shield',
            lane: 'powerup-icon-lane',
            laser: 'powerup-icon-laser',
            nuke: 'powerup-icon-nuke',
            life: 'powerup-icon-life'
        },

        /** Nama properti AssetKeys per jenis buff (digunakan untuk resolve tekstur ikon). */
        iconAssetKey: {
            'atk-speed': 'PowerUpIconAtkSpeed',
            shield: 'PowerUpIconShield',
            lane: 'PowerUpIconLane',
            laser: 'PowerUpIconLaser',
            nuke: 'PowerUpIconNuke',
            life: 'PowerUpIconLife'
        }
    },

    /** Domain item power-up sebagai entitas: kapasitas inventory, pickup, umur, dan pool. */
    item: {
        /** Jumlah slot inventory power-up. */
        slotCount: 3,

        /** Max stack per slot per jenis buff (hanya Slotted; Lane & Life dikecualikan karena AutoPickup). */
        maxStackPerSlot: {
            'atk-speed': 3,
            shield: 2,
            laser: 2,
            nuke: 1
        },

        /** Interval spawn item power-up, dalam milidetik. */
        spawnIntervalMs: 12000,

        /** Jitter random (±ms) ditambahkan ke interval spawn agar tidak teratur. */
        spawnJitterMs: 7000,

        /** Radius deteksi pickup item terhadap pemain, dalam piksel (lebih besar dari visual item). */
        pickupRadius: 60,

        /** Jarak tambahan di bawah area bermain sebelum item dianggap keluar map, dalam piksel. */
        despawnMargin: 80,

        /** Jumlah item yang di-prewarm di pool; juga menjadi hard cap item aktif. */
        poolSize: 50
    },

    /** Domain proses spawn: zona kemunculan, jarak aman dari pemain, dan bobot jenis. */
    spawn: {
        /**
         * Pengaturan Dynamic Spawn Zone: kotak persegi tetap yang pusatnya diacak
         * di dalam area bermain, lalu dipakai sebagai area spawn item.
         */
        spawnZone: {
            /** Sisi horizontal zona spawn, dalam piksel. */
            width: 300,

            /** Sisi vertikal zona spawn, dalam piksel. */
            height: 300,

            /** Jumlah item sukses di satu zona sebelum zona di-roll ulang. */
            itemsPerZone: 1,

            /** Batas bawah nilai jarak minimum antarzona yang diacak, dalam piksel. */
            minDistanceMin: 100,

            /** Batas atas nilai jarak minimum antarzona yang diacak, dalam piksel. */
            minDistanceMax: 700,

            /** Percobaan acak pusat zona per putaran relaksasi jarak. */
            maxPositionAttempts: 20,

            /** Jumlah putaran relaksasi saat jarak minimum antarzona sulit tercapai. */
            maxRelaxRounds: 6,

            /** Penurunan nilai jarak minimum per putaran relaksasi, dalam piksel. */
            relaxStep: 50,

            /** Percobaan acak posisi item di dalam zona sebelum spawn dibatalkan. */
            itemSpawnMaxAttempts: 12
        },

        /** Jarak minimum dari pusat pemain ke pusat item saat spawn, dalam piksel. */
        minPlayerSpawnDistance: 150,

        /** Bobot spawn per jenis power-up (semakin tinggi semakin sering). */
        bobot: {
            lane: 3,
            'atk-speed': 2,
            shield: 2,
            laser: 1,
            nuke: 1,
            life: 2
        }
    },

    /** Domain jalur gerak item: komposisi kantong pola dan rentang nilai per pola. */
    movement: {
        /** Komposisi kantong pola gerak (kelereng per pola, total 9). */
        patternBagCounts: {
            straight: 5,
            sine: 3,
            infinity: 1
        },

        /** Rentang nilai per pola; field yang tidak ada dianggap 0 saat roll. */
        ranges: {
            /** Jatuh lurus dengan arah diagonal acak. */
            straight: {
                speed: { min: 100, max: 200 },

                /** Sudut arah gerak dalam derajat: 0 = lurus bawah, negatif = miring kiri, positif = miring kanan. */
                angle: { min: -40, max: 40 }
            },

            /** Offset horizontal sinus, vertikal tetap jatuh lurus. */
            sine: {
                speed: { min: 50, max: 120 },
                amp: { min: 40, max: 200 },
                freq: { min: 1.5, max: 5 }
            },

            /** Offset horizontal dan vertikal sinus (bentuk 8). */
            infinity: {
                speed: { min: 60, max: 110 },
                amp: { min: 80, max: 140 },
                ampY: { min: 40, max: 100 },
                freq: { min: 2, max: 3.5 }
            }
        }
    }
} as const;
