import * as Phaser from 'phaser';
import type { AssetKey } from '../config/AssetKeys';
import { AssetKeys } from '../config/AssetKeys';
import type {
    AssetAnimationFrame,
    AssetFileEntry,
    AssetGeneratedEntry
} from '../config/AssetManifest';
import { AssetManifest } from '../config/AssetManifest';
import { EnemyConfig } from '../config/EnemyConfig';
import { PlayerConfig } from '../config/PlayerConfig';
import type { AssetRef } from '../types/AssetRef';

/** Ukuran kanvas tekstur placeholder untuk entity (bukan ukuran hitbox). */
const TEXTURE_SIZE = 48;
/** Warna placeholder pemain. */
const PLAYER_COLOR = 0xff3b30;
/** Warna placeholder frame idle kedua (lebih terang agar animasi terlihat). */
const PLAYER_IDLE_ALT_COLOR = 0xff6b60;
/** Warna placeholder musuh. */
const ENEMY_COLOR = 0xffd60a;
/** Warna placeholder peluru pemain. */
const PLAYER_BULLET_COLOR = 0x7df9ff;
/** Warna placeholder peluru musuh. */
const ENEMY_BULLET_COLOR = 0xff4fd8;

/** Warna placeholder ikon power-up (dipakai PLACEHOLDER_RECIPES di bawah). */
const POWER_UP_ICON_ATK_SPEED_COLOR = 0x7df9ff;
const POWER_UP_ICON_SHIELD_COLOR = 0x4da6ff;
const POWER_UP_ICON_LANE_COLOR = 0xff8c00;
const POWER_UP_ICON_LASER_COLOR = 0x8a2be2;
const POWER_UP_ICON_NUKE_COLOR = 0xff0000;
const POWER_UP_ICON_LIFE_COLOR = 0x00ff00;

/** Satu resep gambar placeholder: ukuran kanvas + rutin menggambar. */
interface PlaceholderRecipe
{
    /** Lebar tekstur hasil generate. */
    readonly width: number;
    /** Tinggi tekstur hasil generate. */
    readonly height: number;
    /** Menggambar bentuk placeholder ke Graphics yang diberikan. */
    readonly draw: (graphics: Phaser.GameObjects.Graphics) => void;
}

/** Gabungan entri fisik yang bisa di-resolve menjadi tekstur. */
type AssetManifestEntry = AssetFileEntry | AssetGeneratedEntry;

/** Resep placeholder, dipisah dari manifest supaya manifest tetap data murni. */
const PLACEHOLDER_RECIPES: Partial<Record<AssetKey, PlaceholderRecipe>> = {
    [AssetKeys.Player]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(PLAYER_COLOR, 1);
            graphics.fillTriangle(
                TEXTURE_SIZE / 2, 4,
                4, TEXTURE_SIZE - 4,
                TEXTURE_SIZE - 4, TEXTURE_SIZE - 4
            );
        }
    },
    [AssetKeys.PlayerIdleAlt]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(PLAYER_IDLE_ALT_COLOR, 1);
            graphics.fillTriangle(
                TEXTURE_SIZE / 2, 4,
                4, TEXTURE_SIZE - 4,
                TEXTURE_SIZE - 4, TEXTURE_SIZE - 4
            );
        }
    },
    [AssetKeys.Enemy]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(ENEMY_COLOR, 1);
            graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        }
    },
    [AssetKeys.PlayerBullet]: {
        width: PlayerConfig.weapon.bulletRadius * 2,
        height: PlayerConfig.weapon.bulletRadius * 2,
        draw: (graphics) => {
            const radius = PlayerConfig.weapon.bulletRadius;
            graphics.fillStyle(PLAYER_BULLET_COLOR, 1);
            graphics.fillCircle(radius, radius, radius);
        }
    },
    [AssetKeys.EnemyBullet]: {
        width: EnemyConfig.bullet.radius * 2,
        height: EnemyConfig.bullet.radius * 2,
        draw: (graphics) => {
            const radius = EnemyConfig.bullet.radius;
            graphics.fillStyle(ENEMY_BULLET_COLOR, 1);
            graphics.fillCircle(radius, radius, radius);
        }
    },
    [AssetKeys.PowerUpIconAtkSpeed]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(POWER_UP_ICON_ATK_SPEED_COLOR, 1);
            graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        }
    },
    [AssetKeys.PowerUpIconShield]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(POWER_UP_ICON_SHIELD_COLOR, 1);
            graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        }
    },
    [AssetKeys.PowerUpIconLane]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(POWER_UP_ICON_LANE_COLOR, 1);
            graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        }
    },
    [AssetKeys.PowerUpIconLaser]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(POWER_UP_ICON_LASER_COLOR, 1);
            graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        }
    },
    [AssetKeys.PowerUpIconNuke]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(POWER_UP_ICON_NUKE_COLOR, 1);
            graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        }
    },
    [AssetKeys.PowerUpIconLife]: {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        draw: (graphics) => {
            graphics.fillStyle(POWER_UP_ICON_LIFE_COLOR, 1);
            graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        }
    }
};

/**
 * Satu pintu untuk semua aset ber-key: muat file, generate placeholder,
 * daftarkan animasi, dan resolve logical key menjadi `{ texture, frame }`.
 * Class ini static tanpa state karena data aset sebenarnya hidup di
 * TextureManager/AnimationManager milik Phaser (global per game).
 */
export class AssetManager
{
    /** Gabungan entri manifest yang punya bentuk fisik (file + generated). */
    private static readonly PHYSICAL_ENTRIES: readonly AssetManifestEntry[] = [
        ...AssetManifest.boot,
        ...AssetManifest.main,
        ...AssetManifest.placeholders
    ];

    /** Mendaftarkan aset minimal yang dibutuhkan Preloader (dipanggil Boot). */
    public static preloadBoot(scene: Phaser.Scene): void
    {
        AssetManager.loadEntries(scene, AssetManifest.boot);
    }

    /** Mendaftarkan aset utama game (dipanggil Preloader). */
    public static preloadMain(scene: Phaser.Scene): void
    {
        AssetManager.loadEntries(scene, AssetManifest.main);
    }

    /**
     * Membuat semua tekstur placeholder yang belum ada.
     * Guard `textures.exists` membuat pemanggilan berulang aman dan mencegah
     * placeholder menimpa aset asli saat migrasi bertahap.
     */
    public static ensurePlaceholders(scene: Phaser.Scene): void
    {
        const graphics = scene.make.graphics({}, false);

        for (const entry of AssetManifest.placeholders)
        {
            if (scene.textures.exists(entry.key))
            {
                continue;
            }

            const recipe = PLACEHOLDER_RECIPES[entry.key];

            if (recipe === undefined)
            {
                continue;
            }

            graphics.clear();
            recipe.draw(graphics);
            graphics.generateTexture(entry.key, recipe.width, recipe.height);
        }

        graphics.destroy();
    }

    /**
     * Mendaftarkan animasi global dari manifest (idempotent lewat `anims.exists`).
     * Wajib dipanggil setelah `ensurePlaceholders` agar tekstur frame tersedia.
     */
    public static ensureAnimations(scene: Phaser.Scene): void
    {
        for (const animation of Object.values(AssetManifest.animations))
        {
            if (scene.anims.exists(animation.key))
            {
                continue;
            }

            scene.anims.create({
                key: animation.key,
                frames: animation.frames.map((frame: AssetAnimationFrame) => (
                    frame.frame === undefined
                        ? { key: frame.texture }
                        : { key: frame.texture, frame: frame.frame }
                )),
                frameRate: animation.frameRate,
                repeat: animation.repeat
            });
        }
    }

    /**
     * Mengubah logical key menjadi referensi tekstur yang bisa dipakai Phaser.
     * Sekarang hampir identitas; saat atlas datang, `frame` diambil dari manifest
     * di sini sehingga entity/pool tidak perlu berubah.
     */
    public static resolve(key: AssetKey): AssetRef
    {
        const entry = AssetManager.PHYSICAL_ENTRIES.find((item) => item.key === key);

        if (entry?.frame === undefined)
        {
            return { texture: entry?.key ?? key };
        }

        return { texture: entry.key, frame: entry.frame };
    }

    /** Mendaftarkan semua entri file ke LoaderPlugin scene. */
    private static loadEntries(scene: Phaser.Scene, entries: readonly AssetFileEntry[]): void
    {
        for (const entry of entries)
        {
            scene.load.image(entry.key, entry.path);
        }
    }
}
