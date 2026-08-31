import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AudioService } from './services/audio';
import { CelestialCanvas } from './components/celestial-canvas';
import { SolarEclipse } from './components/solar-eclipse';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    CelestialCanvas,
    SolarEclipse,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly audio = inject(AudioService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  burstCounter = signal<number>(0);
  heartRainCounter = signal<number>(0);

  ngOnInit() {
    // Prevent default touch dragging on mobile window so gesture canvas is fluid
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }

  onCelestialBurst() {
    this.burstCounter.update((c) => c + 1);
  }

  onHeartRain() {
    this.heartRainCounter.update((c) => c + 1);
  }
}
