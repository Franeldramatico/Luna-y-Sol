import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AudioService } from '../services/audio';

@Component({
  selector: 'app-solar-eclipse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      #stageWrapper
      class="relative w-full h-[100dvh] flex flex-col justify-between items-center overflow-hidden select-none px-4 py-4 sm:py-6"
    >
      <!-- ASTRONOMICAL ECLIPSE CANVAS: Full interactive rendering engine -->
      <canvas
        #eclipseCanvas
        id="solar-eclipse-canvas"
        class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-10"
        (mousedown)="onPointerDown($event)"
        (mousemove)="onPointerMove($event)"
        (mouseup)="onPointerUp()"
        (mouseleave)="onPointerUp()"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onTouchEnd()"
      ></canvas>

      <!-- TOP MINIMAL HEADER BAR -->
      <div class="relative z-20 w-full max-w-4xl flex items-center justify-between pointer-events-auto">
        <!-- Logo / Dedication -->
        <div class="flex items-center gap-2.5">
          <span class="text-amber-300 text-xs sm:text-sm animate-pulse">✦</span>
          <span class="font-signature text-2xl sm:text-3xl text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.65)]">
            Aranxita
          </span>
        </div>

        <!-- Ambient Sound Control -->
        <button
          type="button"
          (click)="toggleMusic()"
          class="px-3.5 py-1.5 rounded-full luxe-glass flex items-center gap-2 text-xs font-cinzel cursor-pointer active:scale-95 transition-all duration-500"
          [ngClass]="{
            'border-amber-400/60 text-amber-200 shadow-md shadow-amber-400/20': !audio.isMuted(),
            'border-stone-800/80 text-stone-400 hover:text-stone-200': audio.isMuted()
          }"
          aria-label="Alternar música celestial"
        >
          <mat-icon class="text-sm">
            {{ audio.isMuted() ? 'volume_off' : 'music_note' }}
          </mat-icon>
          <span class="text-[10px] tracking-widest uppercase hidden sm:inline">
            {{ audio.isMuted() ? 'Sonido' : 'Celestial' }}
          </span>
        </button>
      </div>

      <!-- CENTER CONJUNCTION & LETTER ACTION (Appears ONLY when orbit is at 100% Totality) -->
      <div class="relative z-20 my-auto text-center pointer-events-none transition-all duration-1000 max-w-lg mx-auto flex flex-col items-center gap-3.5 sm:gap-4 px-2">
        
        <!-- Totality Poem / Message -->
        <div
          class="space-y-2 sm:space-y-3 transition-all duration-1000"
          [ngClass]="{
            'opacity-100 translate-y-0 scale-100': isOrbital100(),
            'opacity-0 -translate-y-4 scale-95 pointer-events-none hidden': !isOrbital100()
          }"
        >
          <div class="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full luxe-glass border-amber-400/30 text-[10px] sm:text-xs font-editorial uppercase tracking-[0.3em] text-amber-300">
            <span>Para Mi Sol & Mi Luna</span>
          </div>

          <h1 class="text-2xl sm:text-4xl md:text-5xl font-cinzel font-light text-[#FDF8F2] tracking-wide filter drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]">
            Mi cielo encontró <br />
            <span class="italic font-normal text-amber-200 filter drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]">
              su eclipse.
            </span>
          </h1>

          <p class="font-garamond italic text-sm sm:text-lg text-stone-300/90 max-w-md mx-auto leading-relaxed">
            “El instante donde dos mundos se funden para encender la luz más hermosa del universo.”
          </p>
        </div>

        <!-- SPECIAL LETTER BUTTON (ONLY appears when orbit reaches 100% totality) -->
        <div
          class="pointer-events-auto transition-all duration-700 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3"
          [ngClass]="{
            'opacity-100 translate-y-0 scale-100': isOrbital100(),
            'opacity-0 translate-y-8 scale-90 pointer-events-none hidden': !isOrbital100()
          }"
        >
          <!-- Open Letter Button -->
          <button
            type="button"
            id="open-letter-btn"
            (click)="openLetter()"
            class="px-6 py-3 rounded-full luxe-glass border-2 border-amber-400/80 text-amber-100 text-xs sm:text-sm font-cinzel tracking-widest uppercase hover:border-amber-300 hover:bg-amber-500/25 hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all duration-500 flex items-center gap-2.5 cursor-pointer active:scale-95 shadow-xl animate-pulse min-h-[44px]"
          >
            <mat-icon class="text-base text-amber-300">mail</mat-icon>
            <span>Carta para Aranxita 💌</span>
          </button>

          <!-- Starlight Sparkle Button -->
          <button
            type="button"
            (click)="triggerBurst()"
            class="px-4 py-2.5 rounded-full luxe-glass border border-amber-400/40 text-amber-200 text-xs font-cinzel tracking-widest uppercase hover:border-amber-300 hover:bg-amber-500/20 transition-all duration-500 flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 min-h-[40px]"
          >
            <mat-icon class="text-sm text-amber-300">auto_awesome</mat-icon>
            <span>Destellos</span>
          </button>
        </div>

      </div>

      <!-- VISUAL SCROLL / SWIPE DOWN INDICATOR (Prominent when not aligned) -->
      @if (progress() < 0.18 && !isDragging) {
        <div
          class="relative z-20 mb-2 pointer-events-none flex flex-col items-center gap-1.5 transition-all duration-700 animate-pulse"
        >
          <div class="flex items-center gap-2 px-4 py-1.5 rounded-full luxe-glass border-amber-400/30 text-amber-200/90 text-[10px] sm:text-xs font-editorial uppercase tracking-[0.25em] shadow-lg shadow-amber-500/10">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Desliza hacia abajo para alinear</span>
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          </div>
          <mat-icon class="text-base text-amber-300/80 animate-bounce" style="animation-duration: 2.2s;">
            keyboard_arrow_down
          </mat-icon>
        </div>
      }

      <!-- BOTTOM LUXE SCRUBBER & CALM ORBIT DECK -->
      <div class="relative z-20 w-full max-w-md flex flex-col items-center gap-2 pointer-events-auto pb-2">
        <div class="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-full luxe-glass">
          
          <!-- Auto-Orbit Play/Pause -->
          <button
            type="button"
            (click)="toggleAutoOrbit()"
            class="p-1.5 sm:px-3 sm:py-1 rounded-full border text-xs font-cinzel tracking-wider uppercase transition-all duration-500 flex items-center gap-1.5 cursor-pointer shrink-0"
            [ngClass]="{
              'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20': isAutoOrbiting(),
              'border-stone-800/80 bg-stone-900/40 text-stone-400 hover:text-white hover:border-amber-400/40': !isAutoOrbiting()
            }"
            aria-label="Reproducir órbita cósmica"
          >
            <mat-icon class="text-sm text-amber-400">
              {{ isAutoOrbiting() ? 'pause' : 'play_arrow' }}
            </mat-icon>
            <span class="text-[10px] hidden sm:inline">{{ isAutoOrbiting() ? 'Pausar' : 'Órbita' }}</span>
          </button>

          <!-- Alignment Range Scrubber -->
          <div class="flex-1 flex items-center gap-2 sm:gap-3">
            <input
              type="range"
              min="0"
              max="1000"
              [value]="progress() * 1000"
              (input)="onSliderInput($event)"
              class="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800/90 rounded-lg"
              aria-label="Alineación del eclipse"
            />
          </div>

          <!-- Percentage Indicator -->
          <span class="text-xs font-cinzel font-bold text-amber-300 shrink-0 w-8 text-right">
            {{ progressPercentage() }}%
          </span>

        </div>
      </div>

      <!-- ================= MODAL DE LA CARTA PARA ARANXITA (Optimizado para Celular) ================= -->
      @if (showLetterModal()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl transition-all duration-500 animate-ethereal-in"
        >
          <!-- Backdrop overlay button for closing with click or keyboard -->
          <button
            type="button"
            class="absolute inset-0 w-full h-full bg-transparent border-0 cursor-default"
            aria-label="Cerrar modal"
            (click)="showLetterModal.set(false)"
          ></button>

          <div
            class="relative z-10 w-full max-w-lg bg-[#0c0915]/95 border border-amber-400/50 rounded-2xl p-5 sm:p-8 shadow-[0_0_60px_rgba(251,191,36,0.3)] text-stone-200 flex flex-col gap-3.5 sm:gap-4 max-h-[88dvh] overflow-y-auto"
          >
            <!-- Close icon button -->
            <button
              type="button"
              (click)="showLetterModal.set(false)"
              class="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-stone-900/80 border border-stone-700 text-stone-400 hover:text-white hover:border-amber-400/50 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Cerrar carta"
            >
              <mat-icon class="text-base">close</mat-icon>
            </button>

            <!-- Letter Header -->
            <div class="text-center space-y-1 border-b border-amber-400/20 pb-3 sm:pb-4 pr-6 sm:pr-0">
              <div class="text-amber-400 text-[10px] sm:text-xs uppercase font-editorial tracking-[0.3em] flex items-center justify-center gap-1.5">
                <span>✦</span>
                <span>Mensaje del Cosmos</span>
                <span>✦</span>
              </div>
              <h2 class="font-signature text-3xl sm:text-4xl text-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                Para Mi Aranxita Bella
              </h2>
              <p class="font-cinzel text-[10px] sm:text-xs text-amber-300/90 tracking-wider uppercase">
                Muchísima suerte en tus clases de este lunes ✨
              </p>
            </div>

            <!-- Letter Body (Adaptada a sus 2 años de uni y amor incondicional) -->
            <div class="space-y-3 sm:space-y-4 font-garamond text-stone-200 text-sm sm:text-base md:text-lg leading-relaxed pt-1">
              <p class="first-letter:text-3xl sm:first-letter:text-4xl first-letter:font-cinzel first-letter:text-amber-300 first-letter:mr-1 first-letter:float-left">
                Mi niña hermosa, este lunes retomas tus clases en la universidad y quería enviarte este detalle para desearte la mejor de las suertes en cada una de tus materias y proyectos.
              </p>
              <p>
                Ya llevas dos años en la carrera demostrando lo increíblemente inteligente, dedicada y capaz que eres. Me llena de orgullo y admiración ver todo el esfuerzo y corazón que le pones día a día.
              </p>
              <p>
                Solo quiero recordarte lo muchísimo que te amo: <strong>te amo demasiado</strong>, mi cielo. Tienes todo mi apoyo incondicional hoy, mañana y siempre. En los días tranquilos y en los días pesados, jamás olvides lo valiosa que eres y que siempre estoy contigo, animándote y creyendo en ti.
              </p>
              <p class="italic text-amber-100/95 text-center font-serif border-y border-amber-400/20 py-2.5 sm:py-3 my-1 sm:my-2 bg-amber-500/5 rounded-lg px-2">
                “¡Te irá excelente este lunes y en todo el semestre! Eres mi sol, mi luna y mi mayor orgullo.”
              </p>
            </div>

            <!-- Letter Footer / Signature -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-400/20 pt-3.5 sm:pt-4">
              <div class="text-center sm:text-left">
                <span class="text-[10px] sm:text-xs font-editorial uppercase tracking-widest text-stone-400 block">Con todo mi amor infinito,</span>
                <span class="font-signature text-xl sm:text-2xl text-amber-300">Siempre a tu lado ❤️</span>
              </div>

              <button
                type="button"
                id="love-you-btn"
                (click)="onLetterChime()"
                class="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/30 to-amber-500/30 border border-rose-400/70 text-rose-100 text-xs font-cinzel tracking-wider uppercase hover:from-rose-500/40 hover:to-amber-500/40 hover:border-rose-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-md min-h-[44px]"
              >
                <mat-icon class="text-base text-rose-400">favorite</mat-icon>
                <span class="font-bold tracking-widest">¡Te Amo Demasiado!</span>
              </button>
            </div>

            <!-- In-Modal Floating Heart Shower Layer -->
            <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl z-20">
              @for (heart of modalHearts(); track heart.id) {
                <div
                  class="absolute animate-heart-shower select-none pointer-events-none"
                  [style.left.%]="heart.x"
                  [style.top.%]="heart.y"
                  [style.font-size.px]="heart.size"
                  [style.color]="heart.color"
                  [style.animation-delay.s]="heart.delay"
                  [style.animation-duration.s]="heart.duration"
                  [style.filter]="'drop-shadow(0 0 8px ' + heart.color + ')'"
                >
                  {{ heart.symbol }}
                </div>
              }
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class SolarEclipse implements OnInit, OnDestroy {
  readonly audio = inject(AudioService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('eclipseCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // Celestial Burst output for stars canvas
  celestialBurst = output<void>();
  // Heart Rain output for full-screen heart shower
  heartRain = output<void>();

  // Reactive state
  progress = signal<number>(0);
  targetProgress = signal<number>(0);
  isAutoOrbiting = signal<boolean>(false);
  showLetterModal = signal<boolean>(false);
  modalHearts = signal<{ id: number; x: number; y: number; size: number; color: string; symbol: string; delay: number; duration: number }[]>([]);

  progressPercentage = computed<number>(() => {
    return Math.round(this.progress() * 100);
  });

  isTotality = computed<boolean>(() => {
    return this.progress() >= 0.86;
  });

  // Orbital 100% totality condition: when alignment reaches 100%
  isOrbital100 = computed<boolean>(() => {
    return this.progress() >= 0.96;
  });

  // Canvas context & animation
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private time = 0;

  // Touch / Drag tracking
  isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartProgress = 0;

  // Ultra-calm orbit speed for peaceful, relaxing transitions
  private orbitSpeed = 0.0009;
  private orbitDirection = 1;

  // Offscreen canvas caches for photorealistic high-performance rendering
  private sunPlasmaPatternCanvas: HTMLCanvasElement | null = null;
  private moonSurfaceTextureCanvas: HTMLCanvasElement | null = null;

  ngOnInit() {
    if (!this.isBrowser) return;
    this.setupCanvas();
    this.initRealisticTextures();
    this.startRenderLoop();

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
  };

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  /**
   * Generates procedural high-resolution textures for realistic Moon surface and solar plasma
   */
  private initRealisticTextures() {
    if (!this.isBrowser) return;

    // 1. Generate Moon Procedural Surface Texture with noise, regolith grain & ejecta
    const mSize = 512;
    this.moonSurfaceTextureCanvas = document.createElement('canvas');
    this.moonSurfaceTextureCanvas.width = mSize;
    this.moonSurfaceTextureCanvas.height = mSize;
    const mCtx = this.moonSurfaceTextureCanvas.getContext('2d');
    if (mCtx) {
      // Base dark basalt regolith
      mCtx.fillStyle = '#0a0814';
      mCtx.fillRect(0, 0, mSize, mSize);

      // Regolith micro-noise grain
      const imgData = mCtx.getImageData(0, 0, mSize, mSize);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 28;
        data[i] = Math.min(255, Math.max(0, data[i] + noise + 8));     // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + 6)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 14)); // B
      }
      mCtx.putImageData(imgData, 0, 0);

      // Maria Basalt Basins (Mare Tranquillitatis, Serenitatis, Imbrium, Procellarum)
      mCtx.fillStyle = 'rgba(7, 5, 14, 0.72)';
      
      // Imbrium
      mCtx.beginPath();
      mCtx.ellipse(180, 160, 95, 80, -0.2, 0, Math.PI * 2);
      mCtx.fill();

      // Serenitatis
      mCtx.beginPath();
      mCtx.ellipse(310, 160, 65, 60, 0.1, 0, Math.PI * 2);
      mCtx.fill();

      // Tranquillitatis
      mCtx.beginPath();
      mCtx.ellipse(350, 245, 80, 65, 0.3, 0, Math.PI * 2);
      mCtx.fill();

      // Procellarum
      mCtx.beginPath();
      mCtx.ellipse(140, 280, 105, 130, 0.2, 0, Math.PI * 2);
      mCtx.fill();

      // Mare Crisium
      mCtx.beginPath();
      mCtx.ellipse(430, 190, 36, 46, 0.1, 0, Math.PI * 2);
      mCtx.fill();

      // Tycho crater with fine ejecta rays
      const tychoX = 240;
      const tychoY = 410;
      mCtx.strokeStyle = 'rgba(200, 210, 240, 0.18)';
      mCtx.lineWidth = 1.2;
      for (let a = 0; a < 14; a++) {
        const angle = (a * Math.PI) / 7 + 0.1;
        const len = 160 + Math.random() * 80;
        mCtx.beginPath();
        mCtx.moveTo(tychoX, tychoY);
        mCtx.lineTo(tychoX + Math.cos(angle) * len, tychoY + Math.sin(angle) * len);
        mCtx.stroke();
      }

      // Tycho Crater Rim
      mCtx.fillStyle = 'rgba(18, 14, 30, 0.9)';
      mCtx.beginPath();
      mCtx.arc(tychoX, tychoY, 18, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.strokeStyle = 'rgba(160, 175, 210, 0.4)';
      mCtx.lineWidth = 2;
      mCtx.stroke();

      // Copernicus Crater
      const copX = 190;
      const copY = 240;
      mCtx.fillStyle = 'rgba(18, 14, 30, 0.9)';
      mCtx.beginPath();
      mCtx.arc(copX, copY, 16, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.strokeStyle = 'rgba(160, 175, 210, 0.35)';
      mCtx.lineWidth = 1.8;
      mCtx.stroke();

      // Kepler Crater
      mCtx.beginPath();
      mCtx.arc(120, 250, 11, 0, Math.PI * 2);
      mCtx.strokeStyle = 'rgba(160, 175, 210, 0.3)';
      mCtx.lineWidth = 1.4;
      mCtx.stroke();
    }
  }

  private startRenderLoop() {
    let lastStamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastStamp) / 1000, 0.1);
      lastStamp = timestamp;
      this.time += dt;

      // Slow, relaxing auto-orbit
      if (this.isAutoOrbiting()) {
        let next = this.targetProgress() + this.orbitSpeed * this.orbitDirection;
        if (next >= 1) {
          next = 1;
          this.orbitDirection = -1;
        } else if (next <= 0) {
          next = 0;
          this.orbitDirection = 1;
        }
        this.targetProgress.set(next);
      }

      // Smooth calm lerp interpolation
      const currentP = this.progress();
      const targetP = this.targetProgress();
      const diff = targetP - currentP;
      const lerped = Math.abs(diff) < 0.0002 ? targetP : currentP + diff * 0.08;
      this.progress.set(lerped);

      this.renderCanvas();
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  // ================= RENDER ENGINE =================
  private renderCanvas() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    // Optical vertical center
    const cy = this.width < 640 ? this.height * 0.43 : this.height * 0.45;
    
    // Scale solar radius proportionally to screen size
    const minDim = Math.min(this.width, this.height);
    const sunRadius = Math.max(95, Math.min(170, minDim * 0.24));
    const moonRadius = sunRadius * 1.018;

    const p = this.progress();

    // 1. SKY LIGHTING & ATMOSPHERIC DEPTH
    this.drawSkyAtmosphere(ctx, cx, cy, sunRadius, p);

    // 2. CORONA FILAMENTS & STREAMERS (Soft, slow gossamer silk in space)
    if (p > 0.60) {
      this.drawRealisticSolarCorona(ctx, cx, cy, sunRadius, p);
    }

    // 3. SOLAR PROMINENCES (Ruby plasma magnetic loops)
    if (p > 0.74) {
      this.drawRealisticSolarProminences(ctx, cx, cy, sunRadius, p);
    }

    // 4. THE SUN DISK (Ultra-realistic golden photosphere with granulation & limb darkening)
    this.drawRealisticSun(ctx, cx, cy, sunRadius, p);

    // 5. THE MOON SPHERE (Realistic 3D spherical rendering, procedural lunar maria, craters & rim backlight)
    const moonOffsetX = (1 - p) * (sunRadius * 2.45);
    const moonOffsetY = (1 - p) * -(sunRadius * 0.42);
    const moonX = cx + moonOffsetX;
    const moonY = cy + moonOffsetY;

    this.drawRealisticMoon(ctx, moonX, moonY, moonRadius, cx, cy, sunRadius, p);

    // 6. DIAMOND RING EFFECT & BAILY'S BEADS (p between 0.80 and 0.95)
    if (p >= 0.80 && p <= 0.95) {
      this.drawDiamondRing(ctx, cx, cy, moonX, moonY, sunRadius, moonRadius, p);
    }
  }

  // ================= 1. SKY ATMOSPHERE =================
  private drawSkyAtmosphere(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    p: number
  ) {
    const glowRadius = r * (3.0 + p * 1.5);
    const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowRadius);

    if (p < 0.6) {
      const a = (1 - p) * 0.35;
      grad.addColorStop(0, `rgba(255, 180, 70, ${a})`);
      grad.addColorStop(0.35, `rgba(245, 130, 20, ${a * 0.5})`);
      grad.addColorStop(0.7, `rgba(180, 50, 10, ${a * 0.15})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      const totalityIntensity = (p - 0.6) / 0.4;
      grad.addColorStop(0, `rgba(254, 240, 138, ${totalityIntensity * 0.45})`);
      grad.addColorStop(0.35, `rgba(192, 132, 252, ${totalityIntensity * 0.25})`);
      grad.addColorStop(0.7, `rgba(96, 165, 250, ${totalityIntensity * 0.12})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ================= 2. REALISTIC SOLAR CORONA =================
  private drawRealisticSolarCorona(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    p: number
  ) {
    const alpha = Math.min(1, (p - 0.60) / 0.28);
    ctx.save();
    ctx.globalAlpha = alpha;

    // A. Multi-layered pearlescent coronal aura with slow breathing
    const slowBreath = Math.sin(this.time * 0.5) * 0.06;
    const coronaR = r * (2.1 + slowBreath);
    
    // Core white-pearl glow
    const innerCorona = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, coronaR);
    innerCorona.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    innerCorona.addColorStop(0.18, 'rgba(254, 249, 195, 0.75)');
    innerCorona.addColorStop(0.45, 'rgba(232, 121, 249, 0.28)');
    innerCorona.addColorStop(0.75, 'rgba(129, 140, 248, 0.12)');
    innerCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = innerCorona;
    ctx.beginPath();
    ctx.arc(cx, cy, coronaR, 0, Math.PI * 2);
    ctx.fill();

    // B. Magnetic Field Coronal Streamers (Delicate silk gossamer strands)
    const streamCount = 48;
    for (let i = 0; i < streamCount; i++) {
      const baseAngle = (i * (Math.PI * 2)) / streamCount + this.time * 0.01;
      const lengthMult = 0.8 + Math.sin(i * 3.7 + this.time * 0.6) * 0.35 + (i % 4 === 0 ? 0.7 : 0.2);
      const streamLen = r * lengthMult;
      const curve = Math.sin(i * 2.3 + this.time * 0.4) * 22;

      const startX = cx + Math.cos(baseAngle) * (r * 0.98);
      const startY = cy + Math.sin(baseAngle) * (r * 0.98);
      const endX = cx + Math.cos(baseAngle) * (r + streamLen);
      const endY = cy + Math.sin(baseAngle) * (r + streamLen);

      const midAngle = baseAngle + (curve * Math.PI) / 180;
      const ctrlX = cx + Math.cos(midAngle) * (r + streamLen * 0.55);
      const ctrlY = cy + Math.sin(midAngle) * (r + streamLen * 0.55);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      
      const isMajorStreamer = i % 4 === 0;
      ctx.strokeStyle = isMajorStreamer ? 'rgba(255, 255, 255, 0.55)' : 'rgba(254, 240, 138, 0.32)';
      ctx.lineWidth = isMajorStreamer ? 2.4 : 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ================= 3. REALISTIC SOLAR PROMINENCES =================
  private drawRealisticSolarProminences(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    p: number
  ) {
    const alpha = Math.min(1, (p - 0.74) / 0.18);
    ctx.save();
    ctx.globalAlpha = alpha;

    const prominences = [
      { angle: -0.32, radiusOffset: 16, color: '#f43f5e', spread: 0.12 },
      { angle: 0.88, radiusOffset: 20, color: '#ef4444', spread: 0.16 },
      { angle: 2.15, radiusOffset: 14, color: '#fb7185', spread: 0.10 },
      { angle: 3.65, radiusOffset: 18, color: '#f97316', spread: 0.14 },
      { angle: 4.95, radiusOffset: 15, color: '#ec4899', spread: 0.11 },
    ];

    for (const prom of prominences) {
      const slowPulse = Math.sin(this.time * 1.4 + prom.angle) * 3;
      const h = prom.radiusOffset + slowPulse;
      
      const p1x = cx + Math.cos(prom.angle - prom.spread) * r;
      const p1y = cy + Math.sin(prom.angle - prom.spread) * r;
      const p2x = cx + Math.cos(prom.angle + prom.spread) * r;
      const p2y = cy + Math.sin(prom.angle + prom.spread) * r;
      const apexX = cx + Math.cos(prom.angle) * (r + h);
      const apexY = cy + Math.sin(prom.angle) * (r + h);

      // Magnetic loop arch
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.quadraticCurveTo(apexX, apexY, p2x, p2y);
      ctx.strokeStyle = prom.color;
      ctx.shadowColor = prom.color;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Bright incandescent plasma bead at apex
      ctx.beginPath();
      ctx.arc(apexX, apexY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fill();
    }

    ctx.restore();
  }

  // ================= 4. REALISTIC SUN (Photosphere & Convection) =================
  private drawRealisticSun(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    p: number
  ) {
    ctx.save();

    // A. Outward Solar Diffraction Rays
    const raysAlpha = Math.max(0, 1 - p * 1.35);
    if (raysAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = raysAlpha * 0.75;
      const rayCount = 36;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * Math.PI * 2) / rayCount + this.time * 0.012;
        const len = r * (1.6 + Math.sin(i * 3.5 + this.time * 0.7) * 0.25);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.strokeStyle = i % 3 === 0 ? 'rgba(254, 240, 138, 0.45)' : 'rgba(251, 146, 60, 0.25)';
        ctx.lineWidth = i % 3 === 0 ? 2.4 : 1.0;
        ctx.stroke();
      }
      ctx.restore();
    }

    // B. Photosphere Disk with Limb Darkening & Chromospheric rim
    const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.22, '#fffbeb');
    sunGrad.addColorStop(0.48, '#fde047');
    sunGrad.addColorStop(0.72, '#f59e0b');
    sunGrad.addColorStop(0.88, '#d97706');
    sunGrad.addColorStop(0.96, '#b45309');
    sunGrad.addColorStop(1, '#78350f');

    ctx.fillStyle = sunGrad;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 45 + Math.sin(this.time * 0.7) * 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // C. Convective Granulation Cells (Slow boiling plasma cells)
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 22; i++) {
      const gAngle = i * 0.72 + this.time * 0.025;
      const gDist = (r * 0.6) * (0.25 + (i % 5) * 0.18);
      const gx = cx + Math.cos(gAngle) * gDist;
      const gy = cy + Math.sin(gAngle) * gDist;
      const gR = r * (0.22 + (i % 4) * 0.1);

      const granGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gR);
      granGrad.addColorStop(0, '#ffffff');
      granGrad.addColorStop(0.55, '#f97316');
      granGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = granGrad;
      ctx.beginPath();
      ctx.arc(gx, gy, gR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }

  // ================= 5. REALISTIC MOON =================
  private drawRealisticMoon(
    ctx: CanvasRenderingContext2D,
    mx: number,
    my: number,
    mr: number,
    sx: number,
    sy: number,
    sr: number,
    p: number
  ) {
    ctx.save();

    // Clip Moon Circular Body
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();

    // A. Base dark lunar sphere (3D spherical falloff)
    const moonGrad = ctx.createRadialGradient(
      mx + mr * 0.3,
      my - mr * 0.3,
      mr * 0.05,
      mx,
      my,
      mr
    );
    moonGrad.addColorStop(0, '#15102a');
    moonGrad.addColorStop(0.4, '#0d0a1b');
    moonGrad.addColorStop(0.8, '#06040d');
    moonGrad.addColorStop(1, '#000000');

    ctx.fillStyle = moonGrad;
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);

    // B. Draw Procedural Surface Texture (Maria, Tycho, Copernicus)
    if (this.moonSurfaceTextureCanvas) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.moonSurfaceTextureCanvas, mx - mr, my - mr, mr * 2, mr * 2);
      ctx.restore();
    }

    ctx.restore(); // Exit Moon Clip

    // C. Lunar Limb Glow & Fresnel Backlight (as moon crosses the sun)
    const rimAlpha = Math.min(1, Math.max(0.15, p));
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.strokeStyle = p > 0.85 ? 'rgba(254, 240, 138, 0.65)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = p > 0.85 ? 2.5 : 1.2;
    ctx.globalAlpha = rimAlpha;
    ctx.shadowColor = p > 0.85 ? '#fef08a' : '#ffffff';
    ctx.shadowBlur = p > 0.85 ? 14 : 6;
    ctx.stroke();

    ctx.restore();
  }

  // ================= 6. BAILY'S BEADS & DIAMOND RING =================
  private drawDiamondRing(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    mx: number,
    my: number,
    sr: number,
    mr: number,
    p: number
  ) {
    ctx.save();

    const diamondAngle = -0.75 + (p - 0.85) * 0.5;
    const dx = mx + Math.cos(diamondAngle) * mr;
    const dy = my + Math.sin(diamondAngle) * mr;

    const flashIntensity = 1 - Math.abs(p - 0.88) / 0.07;
    if (flashIntensity <= 0) {
      ctx.restore();
      return;
    }

    ctx.globalAlpha = Math.max(0, Math.min(1, flashIntensity));

    // A. Specular Core Flare
    const flareR = 20 * flashIntensity;
    const flareGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, flareR * 2.8);
    flareGrad.addColorStop(0, '#ffffff');
    flareGrad.addColorStop(0.25, '#fef08a');
    flareGrad.addColorStop(0.65, '#f59e0b');
    flareGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = flareGrad;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 32;
    ctx.beginPath();
    ctx.arc(dx, dy, flareR * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // B. Anamorphic Horizontal Lens Flare Beam
    const streakW = (this.width * 0.42) * flashIntensity;
    const streakGrad = ctx.createLinearGradient(dx - streakW, dy, dx + streakW, dy);
    streakGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    streakGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.7)');
    streakGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    streakGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.7)');
    streakGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(dx - streakW, dy);
    ctx.lineTo(dx + streakW, dy);
    ctx.stroke();

    // C. 6-Point Star Diffraction Cross Rays
    const starLen = 65 * flashIntensity;
    for (let i = 0; i < 4; i++) {
      const sAngle = (i * Math.PI) / 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = i === 0 ? 2.0 : 1.0;
      ctx.beginPath();
      ctx.moveTo(dx - Math.cos(sAngle) * starLen, dy - Math.sin(sAngle) * starLen);
      ctx.lineTo(dx + Math.cos(sAngle) * starLen, dy + Math.sin(sAngle) * starLen);
      ctx.stroke();
    }

    // D. Baily's Beads
    const beads = [
      { offset: 0.18, size: 4.0 },
      { offset: -0.15, size: 3.4 },
      { offset: 0.32, size: 2.6 },
    ];
    for (const bead of beads) {
      const bx = mx + Math.cos(diamondAngle + bead.offset) * mr;
      const by = my + Math.sin(diamondAngle + bead.offset) * mr;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bx, by, bead.size * flashIntensity, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ================= TOUCH & GESTURE LISTENERS =================
  onPointerDown(e: MouseEvent) {
    this.stopAutoOrbit();
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartProgress = this.targetProgress();
  }

  onPointerMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const deltaX = (e.clientX - this.dragStartX) / (this.width * 0.45);
    const deltaY = (e.clientY - this.dragStartY) / (this.height * 0.45);
    const totalDelta = deltaY - deltaX;
    const newP = Math.max(0, Math.min(1, this.dragStartProgress + totalDelta));
    this.targetProgress.set(newP);
  }

  onPointerUp() {
    this.isDragging = false;
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.stopAutoOrbit();
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.dragStartProgress = this.targetProgress();
    }
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging || e.touches.length !== 1) return;
    const deltaX = (e.touches[0].clientX - this.dragStartX) / (this.width * 0.45);
    const deltaY = (e.touches[0].clientY - this.dragStartY) / (this.height * 0.45);
    const totalDelta = deltaY - deltaX;
    const newP = Math.max(0, Math.min(1, this.dragStartProgress + totalDelta));
    this.targetProgress.set(newP);
  }

  onTouchEnd() {
    this.isDragging = false;
  }

  @HostListener('window:wheel', ['$event'])
  onWheel(e: WheelEvent) {
    this.stopAutoOrbit();
    const delta = e.deltaY * 0.0009;
    const newP = Math.max(0, Math.min(1, this.targetProgress() + delta));
    this.targetProgress.set(newP);
  }

  // ================= UI ACTIONS =================
  onSliderInput(event: Event) {
    this.stopAutoOrbit();
    const val = Number((event.target as HTMLInputElement).value) / 1000;
    this.targetProgress.set(val);
    if (val >= 0.85) {
      this.audio.playStarChime(5);
    }
  }

  toggleAutoOrbit() {
    if (this.isAutoOrbiting()) {
      this.stopAutoOrbit();
    } else {
      this.startAutoOrbit();
    }
  }

  private startAutoOrbit() {
    this.isAutoOrbiting.set(true);
  }

  private stopAutoOrbit() {
    this.isAutoOrbiting.set(false);
  }

  openLetter() {
    this.audio.playPaperSound();
    this.showLetterModal.set(true);
  }

  onLetterChime() {
    this.audio.playHeartChime();
    this.celestialBurst.emit();
    this.heartRain.emit();
    this.spawnModalHearts();
  }

  private spawnModalHearts() {
    const colors = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#fbbf24', '#fde047', '#e11d48'];
    const symbols = ['💖', '✨', '❤️', '💕', '💫', '🌸', '✨', '💗'];
    const hearts: { id: number; x: number; y: number; size: number; color: string; symbol: string; delay: number; duration: number }[] = [];

    const count = 28;
    for (let i = 0; i < count; i++) {
      hearts.push({
        id: Date.now() + i,
        x: Math.random() * 92 + 4,
        y: Math.random() * 80 + 10,
        size: Math.random() * 16 + 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        delay: Math.random() * 0.8,
        duration: Math.random() * 1.5 + 2.0,
      });
    }

    this.modalHearts.set(hearts);

    // Auto cleanup after animation ends
    setTimeout(() => {
      this.modalHearts.set([]);
    }, 4500);
  }

  triggerBurst() {
    this.celestialBurst.emit();
    this.audio.playStarChime(7);
  }

  toggleMusic() {
    this.audio.toggleMusic();
  }
}
