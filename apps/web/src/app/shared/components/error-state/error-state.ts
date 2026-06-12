import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { UI_TEXTS } from '../../../core/config/texts';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="error" role="alert">
      <p class="icon" aria-hidden="true">🌧️</p>
      <p class="message">{{ message() }}</p>
      @if (canRetry()) {
        <button type="button" (click)="retry.emit()">
          {{ texts.retryButton }}
        </button>
      }
    </div>
  `,
  styles: `
    .error {
      display: grid;
      justify-items: center;
      gap: 0.5rem;
      padding: 2rem 1.25rem;
      text-align: center;
      color: #fff6e8;
    }

    .icon {
      margin: 0;
      font-size: 2.5rem;
    }

    .message {
      margin: 0;
      font-size: 1.05rem;
      max-width: 26rem;
    }

    button {
      margin-top: 0.75rem;
      padding: 0.7rem 1.75rem;
      font-size: 1rem;
      font-weight: 700;
      font-family: inherit;
      color: #26332d;
      background: #fff6e8;
      border: none;
      border-radius: 999px;
      cursor: pointer;

      &:focus-visible {
        outline: 3px solid #f47b3f;
        outline-offset: 3px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorState {
  readonly message = input.required<string>();
  readonly canRetry = input(false);
  readonly retry = output<void>();

  protected readonly texts = UI_TEXTS;
}
