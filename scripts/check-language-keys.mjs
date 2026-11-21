// Membandingkan daftar key antar file bahasa agar tidak ada terjemahan yang tertinggal.
// Dipakai lewat `npm run lang:check`; keluar dengan kode 1 kalau ada key yang tidak simetris.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LANGUAGE_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'game',
    'config',
    'language'
);

const LANGUAGES = ['en', 'id'];

// Membaca satu file bahasa lalu mengembalikan himpunan key-nya.
async function readKeys(language) {
    const filePath = path.join(LANGUAGE_DIR, `${language}.json`);
    // Editor Windows bisa menambahkan BOM; dibuang agar JSON.parse tidak gagal.
    const raw = (await readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
    const table = JSON.parse(raw);

    return new Set(Object.keys(table));
}

// Mencetak key yang hanya ada di satu sisi perbandingan.
function reportMissing(sourceLanguage, targetLanguage, sourceKeys, targetKeys) {
    const missing = [...sourceKeys].filter((key) => !targetKeys.has(key));

    if (missing.length === 0) {
        return 0;
    }

    console.error(`Key hanya ada di ${sourceLanguage}.json:`);

    for (const key of missing) {
        console.error(`  - ${key}`);
    }

    return missing.length;
}

async function main() {
    const tables = new Map();

    for (const language of LANGUAGES) {
        tables.set(language, await readKeys(language));
    }

    const [first, ...rest] = LANGUAGES;
    let mismatchCount = 0;

    for (const language of LANGUAGES) {
        console.log(`${language}.json: ${tables.get(language).size} key`);
    }

    for (const language of rest) {
        mismatchCount += reportMissing(first, language, tables.get(first), tables.get(language));
        mismatchCount += reportMissing(language, first, tables.get(language), tables.get(first));
    }

    if (mismatchCount > 0) {
        console.error(`\nGAGAL: ${mismatchCount} key tidak simetris antar file bahasa.`);
        process.exit(1);
    }

    console.log('\nOK: semua file bahasa punya key yang sama.');
}

main().catch((error) => {
    console.error('Gagal memeriksa file bahasa:', error.message);
    process.exit(1);
});
