import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { UI_TEXTS } from '../../../../core/config/texts';
import { DatePlan } from '../../../../core/models/date-plan.model';
import { SpinResult } from '../../../../core/models/spin.model';
import { PlansApiService } from '../../../../core/services/plans-api.service';
import { SpinsApiService } from '../../../../core/services/spins-api.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { LoadingState } from '../../../../shared/components/loading-state/loading-state';
import { MountainBackground } from '../../components/mountain-background/mountain-background';
import { ResultCard } from '../../components/result-card/result-card';
import { Wheel } from '../../components/wheel/wheel';
import { computeWheelRotation } from '../../utils/wheel-rotation';

const EXTRA_TURNS = 5;

@Component({
  selector: 'app-date-wheel-page',
  imports: [MountainBackground, Wheel, ResultCard, LoadingState, ErrorState],
  templateUrl: './date-wheel-page.html',
  styleUrl: './date-wheel-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateWheelPage implements OnInit {
  private readonly plansApi = inject(PlansApiService);
  private readonly spinsApi = inject(SpinsApiService);

  protected readonly texts = UI_TEXTS;

  protected readonly plans = signal<DatePlan[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly spinning = signal(false);
  protected readonly spinError = signal(false);
  protected readonly result = signal<SpinResult | null>(null);
  protected readonly showResult = signal(false);
  protected readonly resultDecided = signal(false);
  protected readonly rotation = signal(0);

  private pendingResult: SpinResult | null = null;

  protected readonly notEnoughPlans = computed(
    () => !this.loading() && !this.loadError() && this.plans().length < 2,
  );

  protected readonly wheelReady = computed(
    () => !this.loading() && !this.loadError() && this.plans().length >= 2,
  );

  ngOnInit(): void {
    this.loadPlans();
  }

  protected loadPlans(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.plansApi.getActivePlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected spin(): void {
    if (this.spinning() || !this.wheelReady()) {
      return;
    }

    this.spinning.set(true);
    this.spinError.set(false);
    this.showResult.set(false);
    this.resultDecided.set(false);
    this.result.set(null);

    this.spinsApi.spin().subscribe({
      next: (spinResult) => {
        const index = this.plans().findIndex(
          (plan) => plan.id === spinResult.selectedPlan.id,
        );

        if (index === -1) {
          this.spinning.set(false);
          this.spinError.set(true);
          this.loadPlans();
          return;
        }

        this.pendingResult = spinResult;
        this.rotation.set(
          computeWheelRotation({
            itemCount: this.plans().length,
            selectedIndex: index,
            currentRotation: this.rotation(),
            extraTurns: EXTRA_TURNS,
          }),
        );
      },
      error: () => {
        this.spinning.set(false);
        this.spinError.set(true);
      },
    });
  }

  protected onSpinEnd(): void {
    if (!this.pendingResult) {
      return;
    }

    this.result.set(this.pendingResult);
    this.pendingResult = null;
    this.showResult.set(true);
    this.spinning.set(false);
  }

  protected onAccept(): void {
    const current = this.result();

    if (!current || this.resultDecided()) {
      return;
    }

    this.resultDecided.set(true);
    this.spinsApi.decide(current.id, 'ACCEPTED').subscribe({
      error: () => {
        /* La decisión se registra de forma silenciosa; no bloqueamos a la usuaria. */
      },
    });
  }

  protected onSpinAgain(): void {
    const current = this.result();

    if (current && !this.resultDecided()) {
      this.spinsApi.decide(current.id, 'REJECTED').subscribe({
        error: () => {
          /* Registro silencioso del rechazo. */
        },
      });
    }

    this.showResult.set(false);
    this.spin();
  }

  protected onCloseResult(): void {
    this.showResult.set(false);
  }
}
