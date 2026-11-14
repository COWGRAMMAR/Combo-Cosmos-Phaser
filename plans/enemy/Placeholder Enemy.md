
Dokumen ini mendefinisikan aset/visual **placeholder** untuk semua enemy dan sistem pendukungnya, sebelum aset final tersedia. Tujuan placeholder: gameplay bisa diuji dan dibaca jelas (siapa musuh apa, kapan menembak, kapan mati) tanpa menunggu art final.

Referensi spesifikasi perilaku: `Ide Enemy.md`.

## Prinsip Umum

- **Bentuk sederhana:** gunakan primitif (lingkaran, persegi, segitiga) tanpa tekstur kompleks.
- **Warna = identitas:** setiap tipe enemy dan jenis proyektil punya warna berbeda agar mudah dibedakan saat playtest.
- **Hitbox = visual:** untuk enemy dan peluru, bentuk visual placeholder harus sama dengan hitbox sebenarnya (jangan beda ukuran), supaya hasil playtest akurat.
- **Mudah diganti:** setiap placeholder punya nama/ID yang konsisten sehingga bisa ditukar dengan aset final tanpa mengubah logika.
- **Parameter terpisah:** ukuran, warna, durasi efek diatur lewat parameter (configurable), bukan di-hardcode.

## 1. Placeholder Unit Enemy (Body & Hitbox)

Bentuk hitbox untuk semua enemy reguler: **lingkaran**.

|Enemy|Tipe|Bentuk|Ukuran relatif|Warna usulan|
|---|---|---|---|---|
|Grunt|1|Lingkaran|Kecil (paling kecil)|Putih / abu-abu|
|Machine Gun / Interceptor|2|Lingkaran|Sedang|Oranye|
|Sharpshooter / Sniper|2|Lingkaran|Sedang|Biru|
|Missile Cruiser|2|Lingkaran|Sedang|Hijau|
|Mothership (Boss)|3|Persegi panjang besar (lihat bagian 6)|Sangat besar|Merah tua|

Aturan:

- Ukuran Tipe 1 **selalu lebih kecil** dari Tipe 2.
- Ketiga varian Tipe 2 memakai ukuran sama, dibedakan hanya oleh warna (atau penanda kecil di tengah lingkaran, misal huruf/ikon).
- Ukuran (radius) dan warna harus configurable.

## 2. Placeholder Proyektil

Bentuk hitbox peluru: **lingkaran kecil** (misil: kapsul/segitiga memanjang agar arahnya terlihat).

|Proyektil|Dipakai oleh|Bentuk|Catatan visual|
|---|---|---|---|
|Peluru Biasa (Standard Bullet)|Grunt, Machine Gun, Sniper, turret standar Boss, senjata utama Boss|Lingkaran kecil|Warna mengikuti warna penembaknya|
|Peluru Cepat / Terarah (opsional)|Sniper, Aimed Sniping Boss|Lingkaran kecil atau elips memanjang|Lebih terang/kontras dari peluru lambat|
|Misil Penjejak (Homing Missile)|Missile Cruiser, turret misil Boss, Missile Swarm|Kapsul / segitiga kecil|Ujung depan jelas supaya rotasi (steering) terbaca; ada jejak asap|

Parameter yang tetap configurable (mengikuti `Ide Enemy.md`): warna & sprite, kecepatan, hitbox, damage. Misil: steer/rotation force, speed, homing duration.

## 3. Placeholder Efek Menembak (Muzzle Effect)

Efek singkat di moncong/titik tembak saat enemy melepas proyektil (seperti asap atau api).

- **Muzzle flash kecil:** untuk Grunt dan peluru biasa (kilatan/percikan singkat).
- **Muzzle flash sedang:** untuk Machine Gun, Sniper, turret Boss.
- **Muzzle smoke / launch puff:** untuk peluncuran misil (kepulan asap).
- **Efek charging (persiapan):** indikator visual sebelum menembak, untuk Sniper (charge) dan Missile Cruiser (jeda sebelum meluncur). Contoh: lingkaran yang mengecil/membesar atau garis bidik tipis ke arah Player.
- **Indikator aiming (Sesi Diam):** untuk Machine Gun, penanda bahwa unit sedang mengunci arah ke Player.

Aturan:

- Efek muncul tepat di titik spawn proyektil (muzzle point) dan mengikuti arah tembakan.
- Durasi singkat (±0.1–0.3 detik, configurable); jangan menutupi peluru atau Player.
- Untuk tembakan beruntun (burst), efek tidak boleh menumpuk berlebihan.

## 4. Placeholder Efek Jejak Misil (Trail)

- Jejak asap/api pendek di belakang Homing Missile.
- Berfungsi sebagai petunjuk arah dan status: misil yang sudah kehilangan kuncian (homing habis) boleh diberi perubahan warna jejak (opsional) agar player tahu misil kini lurus.

## 5. Placeholder Efek Mati (Ledakan)

Efek saat enemy hancur.

|Ukuran ledakan|Dipakai untuk|Catatan|
|---|---|---|
|Kecil|Grunt (Tipe 1)|Singkat, sederhana (lingkaran memudar / partikel sedikit)|
|Sedang|Enemy Tipe 2|Sedikit lebih besar dan lama dari Tipe 1|
|Besar|Turret Boss yang hancur (jika ada), Mothership|Efek bertahap; Boss boleh punya rangkaian ledakan lalu ledakan akhir|

Aturan:

- Posisi ledakan di titik pusat enemy; skala mengikuti ukuran hitbox.
- Enemy langsung dinonaktifkan (tidak bisa menembak/menabrak) saat efek ledakan dimulai.
- Durasi dan skala configurable.

## 6. Placeholder Mothership / Boss

- **Badan utama:** persegi panjang besar (atau komposisi beberapa persegi) di bagian atas layar; sebagai hitbox boss.
- **4 Slot Turret Sekunder:** 4 penanda kecil (2 kiri, 2 kanan) pada badan boss, masing-masing berwarna sesuai jenis senjatanya (Machine Gun / Sniper / Missile).
- **1 Slot Senjata Utama:** penanda di tengah badan boss.
- **Pintu garasi (spawner):** penanda di bagian depan/bawah boss tempat Grunt dan Escort muncul; ada efek buka/tutup sederhana (opsional).
- **3 Slot Formasi Escort:** penanda posisi (lingkaran garis putus-putus) di depan boss (kiri, tengah, kanan); terlihat jelas saat debug, atau hanya tampil saat mode debug aktif.
- **Efek turret/senjata utama:** memakai muzzle effect (bagian 3) dengan ukuran sedang/besar.
- **Efek fase kritis (Desperation Mode, HP < 30%):** perubahan warna/kilatan pada badan boss sebagai penanda fase.
- **Efek hancur:** ledakan besar (bagian 5).

## 7. Placeholder Titik Bantu & Debug

Dipakai saat pengembangan/testing, bukan bagian tampilan final:

- **Anchoring node Tipe 2:** 6 titik hinggap di area atas layar; tampilkan berbeda untuk status kosong vs _booked_/terisi.
- **Hitbox overlay:** toggle untuk menampilkan hitbox enemy dan peluru.
- **Garis arah tembakan:** menampilkan arah _targeted/aimed_ ke Player.
- **Pola formasi (Tipe 1):** penanda titik spawn untuk Rain, Horizontal Wall, dan Vertical Line.
- **Penanda gap** pada Curtain Wave (celah dinding peluru Boss).

Semua elemen debug dapat diaktifkan/dinonaktifkan dengan satu toggle.

## Catatan Tambahan

- Warna di dokumen ini hanya usulan; sesuaikan dengan palet game, selama tiap tipe tetap mudah dibedakan.
- Jika ada enemy baru, tambahkan baris di bagian 1, lalu bagian 2-6 sesuai kebutuhan (proyektil, efek tembak, efek mati).