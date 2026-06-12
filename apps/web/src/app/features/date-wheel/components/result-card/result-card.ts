import {
  ChangeDetectionStrategy,
  Component,
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
  readonly spinAgain = output<void>();

  protected readonly texts = UI_TEXTS;
}
