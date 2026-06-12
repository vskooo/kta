import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { UI_TEXTS } from '../../../../core/config/texts';
import { DatePlan } from '../../../../core/models/date-plan.model';
import { SpinResult } from '../../../../core/models/spin.model';
import { PlansApiService } from '../../../../core/services/plans-api.service';
import { SpinsApiService } from '../../../../core/services/spins-api.service';
import { normalizeAngle } from '../../utils/wheel-rotation';
import { DateWheelPage } from './date-wheel-page';

const PLANS: DatePlan[] = [
  {
    id: 'plan-1',
    title: 'Picnic con vista',
    description: null,
    emoji: '🧺',
    category: 'ADVENTURE',
    weight: 1,
  },
  {
    id: 'plan-2',
    title: 'Cafecito y paseo',
    description: null,
    emoji: '☕',
    category: 'FOOD',
    weight: 1,
  },
  {
    id: 'plan-3',
    title: 'Cena casera juntos',
    description: null,
    emoji: '🍝',
    category: 'HOME',
    weight: 1,
  },
  {
    id: 'plan-4',
    title: 'Mirar el atardecer',
    description: null,
    emoji: '🌄',
    category: 'RELAX',
    weight: 1,
  },
];

const SPIN_RESULT: SpinResult = {
  id: 'spin-1',
  spunAt: '2026-06-10T20:00:00.000Z',
  selectedPlan: {
    id: 'plan-2',
    title: 'Cafecito y paseo',
    description: 'Elegir una cafetería y caminar sin apuro.',
    emoji: '☕',
    category: 'FOOD',
  },
};

class PlansApiMock {
  readonly plans$ = new Subject<DatePlan[]>();

  getActivePlans() {
    return this.plans$.asObservable();
  }
}

class SpinsApiMock {
  readonly spin$ = new Subject<SpinResult>();

  spin() {
    return this.spin$.asObservable();
  }
}

describe('DateWheelPage', () => {
  let fixture: ComponentFixture<DateWheelPage>;
  let plansApi: PlansApiMock;
  let spinsApi: SpinsApiMock;

  beforeEach(async () => {
    plansApi = new PlansApiMock();
    spinsApi = new SpinsApiMock();

    await TestBed.configureTestingModule({
      imports: [DateWheelPage],
      providers: [
        { provide: PlansApiService, useValue: plansApi },
        { provide: SpinsApiService, useValue: spinsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateWheelPage);
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function emitPlans(plans: DatePlan[]): Promise<void> {
    fixture.detectChanges();
    plansApi.plans$.next(plans);
    plansApi.plans$.complete();
    await fixture.whenStable();
  }

  function spinButton(): HTMLButtonElement {
    const button = element().querySelector<HTMLButtonElement>('.spin-button');
    if (!button) {
      throw new Error('spin button not found');
    }
    return button;
  }

  function dispatchSpinEnd(): void {
    const rotor = element().querySelector('.rotor');
    if (!rotor) {
      throw new Error('rotor not found');
    }
    const event = new Event('transitionend');
    Object.defineProperty(event, 'propertyName', { value: 'transform' });
    rotor.dispatchEvent(event);
  }

  it('shows the loading message while plans load', () => {
    fixture.detectChanges();
    expect(element().textContent).toContain(UI_TEXTS.loading);
  });

  it('shows a friendly error when plans fail to load', async () => {
    fixture.detectChanges();
    plansApi.plans$.error(new Error('network'));
    await fixture.whenStable();

    expect(element().textContent).toContain(UI_TEXTS.loadError);
    expect(element().textContent).toContain(UI_TEXTS.retryButton);
  });

  it('shows a message when there are fewer than two plans', async () => {
    await emitPlans(PLANS.slice(0, 1));

    expect(element().textContent).toContain(UI_TEXTS.notEnoughPlans);
  });

  it('disables the button while spinning', async () => {
    await emitPlans(PLANS);

    expect(spinButton().disabled).toBe(false);

    spinButton().click();
    await fixture.whenStable();

    expect(spinButton().disabled).toBe(true);
  });

  it('shows a friendly error when the spin request fails', async () => {
    await emitPlans(PLANS);

    spinButton().click();
    await fixture.whenStable();

    spinsApi.spin$.error(new Error('network'));
    await fixture.whenStable();

    expect(element().textContent).toContain(UI_TEXTS.spinError);
    expect(spinButton().disabled).toBe(false);
  });

  it('rotates the wheel to the segment selected by the API', async () => {
    await emitPlans(PLANS);

    spinButton().click();
    await fixture.whenStable();

    spinsApi.spin$.next(SPIN_RESULT);
    spinsApi.spin$.complete();
    await fixture.whenStable();

    const rotor = element().querySelector<SVGGElement>('.rotor');
    const match = /rotate\(([-\d.]+)deg\)/.exec(rotor?.style.transform ?? '');
    expect(match).not.toBeNull();

    const rotation = Number(match?.[1]);
    expect(rotation).toBeGreaterThanOrEqual(5 * 360);
    expect(normalizeAngle(rotation)).toBe(normalizeAngle(360 - 135));
  });

  it('shows the result only after the animation finishes', async () => {
    await emitPlans(PLANS);

    spinButton().click();
    await fixture.whenStable();

    spinsApi.spin$.next(SPIN_RESULT);
    spinsApi.spin$.complete();
    await fixture.whenStable();

    expect(element().querySelector('app-result-card')).toBeNull();

    dispatchSpinEnd();
    await fixture.whenStable();

    expect(element().querySelector('app-result-card')).not.toBeNull();
    expect(element().textContent).toContain(SPIN_RESULT.selectedPlan.title);
    expect(spinButton().disabled).toBe(false);
  });
});
