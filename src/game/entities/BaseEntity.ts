import * as Phaser from 'phaser';
import { runFixedStepsWithTimeConfig } from '../utils/fixedStep';
import type { EntityConfig } from '../types/EntityConfig';
import type { Team } from '../types/Team';
import type { IDamageable } from './IDamageable';

/** Kelas dasar entitas bertim dengan HP, damage, dan body fisika Arcade. */
export abstract class BaseEntity extends Phaser.Physics.Arcade.Sprite implements IDamageable
{
    protected readonly maxHp: number;
    private _hp: number;
    public moveSpeed: number;
    public readonly team: Team;
    protected invulnerableRemainingMs: number = 0;
    private _accumulatorMs: number = 0;

    /** Menyiapkan sprite, HP, tim, dan body fisika entitas. */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: EntityConfig)
    {
        super(scene, x, y, texture);

        this.maxHp = config.maxHp;
        this._hp = config.maxHp;
        this.moveSpeed = config.moveSpeed;
        this.team = config.team;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;

        if (config.bodyRadius !== undefined)
        {
            body.setCircle(
                config.bodyRadius,
                this.width / 2 - config.bodyRadius,
                this.height / 2 - config.bodyRadius
            );
        }

        this.setCollideWorldBounds(true);
    }

    /** Nilai HP saat ini. */
    get hp(): number
    {
        return this._hp;
    }

    /** Nilai HP maksimum. */
    get maxHealth(): number
    {
        return this.maxHp;
    }

    /** Rasio HP saat ini terhadap HP maksimum (0–1). */
    get hpRatio(): number
    {
        return this.maxHp > 0 ? this._hp / this.maxHp : 0;
    }

    /** True selama HP masih di atas nol. */
    get isAlive(): boolean
    {
        return this._hp > 0;
    }

    /** Mengurangi HP, memicu onDamaged(), dan memanggil die() jika HP habis. */
    public takeDamage(amount: number, _source?: unknown): void
    {
        if (!this.isAlive || amount <= 0 || this.isInvulnerable())
        {
            return;
        }

        this._hp = Math.max(0, this._hp - amount);
        this.onDamaged();

        if (this._hp <= 0)
        {
            this.die();
        }
    }



    /** True jika sisa durasi kebal masih berjalan. */
    public isInvulnerable(): boolean
    {
        return this.invulnerableRemainingMs > 0;
    }



    /** Mengaktifkan ulang entitas di posisi baru untuk dipakai dari object pool. */
    public resetForPool(x: number, y: number): void
    {
        this.setPosition(x, y);
        this._hp = this.maxHp;
        this.invulnerableRemainingMs = 0;
        this.setActive(true);
        this.setVisible(true);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = true;
        body.reset(x, y);
    }

    /** Tangkap snapshot input sekali per frame sebelum loop fixed-step; override di subclass yang butuh input. */
    protected captureFrameInput(): void {}

    /** Set ulang accumulator fixed-step agar sisa delta tidak menjadi burst setelah pause/reset. */
    public resetAccumulator(): void
    {
        this._accumulatorMs = 0;
    }

    /** Memanggil updateEntity() setiap frame setelah update dasar Phaser. */
    public preUpdate(time: number, delta: number): void
    {
        super.preUpdate(time, delta);

        this.captureFrameInput();

        this._accumulatorMs = runFixedStepsWithTimeConfig(
            this._accumulatorMs,
            delta,
            (fixedStepMs) => {
                if (this.invulnerableRemainingMs > 0)
                {
                    this.invulnerableRemainingMs = Math.max(0, this.invulnerableRemainingMs - fixedStepMs);
                }

                this.updateEntity(time, fixedStepMs);
            }
        );
    }

    /** Logika per-frame khusus subclass; dipanggil otomatis dari preUpdate(). */
    protected abstract updateEntity(time: number, delta: number): void;

    /** Hook opsional yang dijalankan setiap kali entitas menerima damage. */
    protected onDamaged(): void {}

    /** Aksi yang dijalankan subclass saat HP entitas habis. */
    public abstract die(): void;
}
