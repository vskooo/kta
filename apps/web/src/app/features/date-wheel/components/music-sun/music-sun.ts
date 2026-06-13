import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
} from '@angular/core';
import { UI_TEXTS } from '../../../../core/config/texts';

const MUSIC_SRC = 'song.mp3';

@Component({
  selector: 'app-music-sun',
  templateUrl: './music-sun.html',
  styleUrl: './music-sun.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicSun implements OnDestroy {
  protected readonly texts = UI_TEXTS;
  protected readonly playing = signal(false);

  private audio?: HTMLAudioElement;

  protected toggle(): void {
    if (!this.audio) {
      const audio = new Audio(MUSIC_SRC);
      audio.loop = true;
      audio.preload = 'none';
      audio.addEventListener('play', () => this.playing.set(true));
      audio.addEventListener('pause', () => this.playing.set(false));
      audio.addEventListener('ended', () => this.playing.set(false));
      this.audio = audio;
    }

    if (this.audio.paused) {
      void this.audio.play().catch(() => this.playing.set(false));
    } else {
      this.audio.pause();
    }
  }

  protected toggleFromKey(event: Event): void {
    event.preventDefault();
    this.toggle();
  }

  ngOnDestroy(): void {
    this.audio?.pause();
    this.audio = undefined;
  }
}
