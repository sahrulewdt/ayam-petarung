# TODO - Ubah Ayam Petarung → Dragon Nest Mini App Telegram

## Rencana Edit (iterasi 1)
1. Buka & pahami file utama: `app/page.tsx`.
2. Rewire total model & state:
   - Hapus tipe/konstanta ayam: `ChickenTier`, `NFTChicken`, `BREED_COMBOS`, `eggs`, dll.
   - Hapus state & fungsi: `doBreed`, breeding UI, gacha telur/growth, clan → gunakan guild.
3. Tambahkan model baru:
   - `type HeroClass` dan `interface Hero`.
4. Ganti currency/state:
   - `eggs` → `gold`, tambah `diamond`, `energy`.
5. Ganti navigation/screens agar sesuai Telegram Mini App:
   - Home, Adventure, Nest Raid (boss/raid), Summon, Heroes, Arena, Guild, Market, Boss.
6. Implementasi minimal sistem yang diminta:
   - Hero Summon (gacha hero) mengganti menu Breed.
   - World Boss & Guild Raid (state sederhana).
7. Pastikan build & lint lolos.

## Follow-up setelah iterasi 1
- Jalankan `npm run lint` dan `npm run build`.
- Jalankan `npm run dev` untuk smoke test UI.

