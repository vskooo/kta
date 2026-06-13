import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';
import { UI_TEXTS } from '../../../../core/config/texts';
import { SpinResult } from '../../../../core/models/spin.model';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.html',
  styleUrl: './result-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCard {
  readonly result = input.required<SpinResult>();
  readonly decided = input(false);
  readonly accepted = output<void>();
  readonly spinAgain = output<void>();
  readonly dismissed = output<void>();

  protected readonly texts = UI_TEXTS;

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dismissed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.dismissed.emit();
  }
}
