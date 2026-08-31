import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  color: string;
}

interface StarlightParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  color: string;
  type: 'heart' | 'star' | 'sparkle';
  life: number;
  maxLife: number;
  swaySpeed?: number;
  swayAmp?: number;
  swayPhase?: number;
}

@Component({
  selector: 'app-celestial-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas
      #canvasRef
      id="celestial-canvas"
      class="fixed inset-0 pointer-events-none z-0 w-full h-full"
    ></canvas>
  `,
})
export class CelestialCanvas implements OnInit, OnDestroy {
  @ViewChild('canvasRef', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  burstTrigger = input<number>(0);
  heartRainTrigger = input<number>(0);
  eclipseProgress = input<number>(0);

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private stars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private particles: StarlightParticle[] = [];
  private width = 0;
  private height = 0;
  private lastTime = 0;
  private nextShootingStar = 0;

  constructor() {
    effect(() => {
      const trigger = this.burstTrigger();
      if (trigger > 0 && this.isBrowser) {
        this.spawnBurst();
      }
    });

    effect(() => {
      const heartTrigger = this.heartRainTrigger();
      if (heartTrigger > 0 && this.isBrowser) {
        this.spawnHeartRain();
      }
    });
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.setupCanvas();
    this.initStars();
    this.startLoop();

    window.addEventListener('resize', this.onResize, { passive: true });
  }

  ngOnDestroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    if (this.isBrowser) {
      window.removeEventListener('resize', this.onResize);
    }
  }

  private onResize = () => {
    this.setupCanvas();
    this.initStars();
  };

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(this.width * dpr);
    canvas.height = Math.floor(this.height * dpr);
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  private initStars() {
    const starCount = Math.floor((this.width * this.height) / 3400);
    this.stars = [];
    const colors = [
      '#ffffff',
      '#fffbeb',
      '#fef08a',
      '#e0e7ff',
      '#fbcfe8',
      '#fed7aa',
      '#c7d2fe',
    ];

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.6 + 0.4,
        baseAlpha: Math.random() * 0.6 + 0.15,
        twinkleSpeed: Math.random() * 0.8 + 0.3, // Slower, tranquil twinkling
        twinklePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private startLoop() {
    this.lastTime = performance.now();
    this.nextShootingStar = this.lastTime + 4000 + Math.random() * 4000;

    const frame = (time: number) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      this.updateAndDraw(time, dt);
      this.animId = requestAnimationFrame(frame);
    };

    this.animId = requestAnimationFrame(frame);
  }

  private spawnBurst() {
    const count = 40;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const colors = [
      '#fbbf24',
      '#f59e0b',
      '#f43f5e',
      '#e879f9',
      '#ffffff',
      '#a78bfa',
      '#fde047',
    ];
    const types: ('heart' | 'star' | 'sparkle')[] = ['heart', 'star', 'sparkle'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 40; // Gentle floating speed
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20, // Drift slightly upward
        size: Math.random() * 7 + 4,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2, // Slow peaceful rotation
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        life: 0,
        maxLife: Math.random() * 2.5 + 2.0, // Longer, calmer life
      });
    }
  }

  private spawnHeartRain() {
    const heartColors = [
      '#e11d48', // Ruby red
      '#f43f5e', // Rose
      '#fb7185', // Soft pink
      '#f472b6', // Magenta blush
      '#fbcfe8', // Pastel pink
      '#fbbf24', // Golden starlight
      '#fda4af', // Coral rose
      '#ec4899', // Bright fuchsia
    ];

    // 1. Cascading falling hearts shower from the sky (across full width)
    const skyRainCount = Math.floor(Math.min(this.width / 16, 75)) + 25;
    for (let i = 0; i < skyRainCount; i++) {
      const startX = Math.random() * this.width;
      const startY = -Math.random() * (this.height * 0.4) - 20; // Staggered drop from above
      const fallSpeed = Math.random() * 65 + 45; // Gentle flutter fall

      this.particles.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 20,
        vy: fallSpeed,
        size: Math.random() * 12 + 6,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.5,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
        type: 'heart',
        life: 0,
        maxLife: Math.random() * 3.5 + 4.5, // Long gentle float
        swaySpeed: Math.random() * 2.5 + 1.2,
        swayAmp: Math.random() * 35 + 15,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }

    // 2. Central blooming burst of glowing hearts
    const burstCount = 35;
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 50;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: Math.random() * 10 + 6,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.5,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
        type: 'heart',
        life: 0,
        maxLife: Math.random() * 2.8 + 2.5,
      });
    }
  }

  private updateAndDraw(time: number, dt: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Dynamic background stars intensity increases at totality
    const totalityBonus = Math.max(0, (this.eclipseProgress() - 0.5) * 0.75);

    // 1. Draw Stars with gentle slow twinkling
    for (const star of this.stars) {
      const twinkle = Math.sin((time / 1000) * star.twinkleSpeed + star.twinklePhase);
      const currentAlpha = Math.min(1, Math.max(0.1, star.baseAlpha + twinkle * 0.3 + totalityBonus));

      ctx.fillStyle = star.color;
      ctx.globalAlpha = currentAlpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow for larger stars
      if (star.size > 1.3 && currentAlpha > 0.5) {
        ctx.globalAlpha = currentAlpha * 0.2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Slow Graceful Shooting Stars
    if (time > this.nextShootingStar) {
      const sx = Math.random() * this.width * 0.9;
      const sy = Math.random() * (this.height * 0.4);
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 220 + 260; // Slower, calmer glide
      this.shootingStars.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 110 + 90,
        alpha: 1,
        color: Math.random() > 0.4 ? '#fef08a' : '#ffffff',
      });
      this.nextShootingStar = time + 6000 + Math.random() * 7000;
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.alpha -= dt * 0.45; // Fades out gently and slowly

      if (s.alpha <= 0 || s.x > this.width || s.y > this.height) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      const tailX = s.x - (s.vx / speed) * s.length;
      const tailY = s.y - (s.vy / speed) * s.length;

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.7, s.color);
      grad.addColorStop(1, '#ffffff');

      ctx.save();
      ctx.strokeStyle = grad;
      ctx.globalAlpha = s.alpha;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Starlight Particles Burst & Heart Rain
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      // Handle sinusoidal swaying for falling rain hearts
      if (p.swaySpeed && p.swayAmp && p.swayPhase !== undefined) {
        const swayOffset = Math.sin((time / 1000) * p.swaySpeed + p.swayPhase) * p.swayAmp * dt;
        p.x += swayOffset + p.vx * dt;
      } else {
        p.x += p.vx * dt;
        p.vx *= 0.97;
      }

      p.y += p.vy * dt;
      if (!p.swaySpeed) {
        p.vy *= 0.97;
      }
      p.rotation += p.vRot * dt;

      const progress = p.life / p.maxLife;
      // Gentle fade in at start, fade out at end
      if (progress < 0.1) {
        p.alpha = progress / 0.1;
      } else {
        p.alpha = Math.max(0, 1 - (progress - 0.1) / 0.9);
      }

      if (progress >= 1 || p.y > this.height + 40) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.type === 'heart' ? 14 : 10;

      if (p.type === 'heart') {
        this.drawHeart(ctx, p.size);
      } else if (p.type === 'star') {
        this.drawStar(ctx, p.size);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.35, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.35, 0);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.globalAlpha = 1;
  }

  private drawHeart(ctx: CanvasRenderingContext2D, size: number) {
    const s = size * 0.7;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.5, -s * 1.3, s * 0.5, 0, s * 1.3);
    ctx.bezierCurveTo(s * 1.3, s * 0.5, s, -s * 0.5, 0, s * 0.3);
    ctx.fill();
  }

  private drawStar(ctx: CanvasRenderingContext2D, size: number) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.45;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(0, -outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}
