import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <div class="loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: `
    .loading {
      display: grid;
      justify-items: center;
      gap: 0.75rem;
      padding: 2.5rem 1rem;
      color: #fff6e8;
      text-align: center;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 4px solid rgba(255, 246, 232, 0.3);
      border-top-color: #f47b3f;
      animation: rotate 0.9s linear infinite;
    }

    p {
      margin: 0;
      font-size: 1.05rem;
    }

    @keyframes rotate {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation-duration: 2.5s;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingState {
  readonly message = input.required<string>();
}
