import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { UI_TEXTS } from '../../../../core/config/texts';
import { DatePlan } from '../../../../core/models/date-plan.model';

interface WheelSegment {
  id: string;
  path: string;
  fill: string;
  textColor: string;
  shortTitle: string;
  emoji: string;
  labelX: number;
  labelY: number;
  labelTransform: string;
  emojiX: number;
  emojiY: number;
}

const CENTER = 180;
const RADIUS = 172;
const LABEL_RADIUS = 108;
const EMOJI_RADIUS = 146;
const MAX_LABEL_LENGTH = 14;

const SEGMENT_COLORS: readonly { fill: string; text: string }[] = [
  { fill: '#2e5d49', text: '#fff6e8' },
  { fill: '#f4e0c0', text: '#26332d' },
  { fill: '#d8875f', text: '#2b1d33' },
  { fill: '#8fae94', text: '#26332d' },
  { fill: '#6d5285', text: '#fff6e8' },
];

function polarPoint(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CENTER + radius * Math.sin(rad), CENTER - radius * Math.cos(rad)];
}

function abbreviate(title: string): string {
  if (title.length <= MAX_LABEL_LENGTH) {
    return title;
  }
  return `${title.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`;
}

@Component({
  selector: 'app-wheel',
  templateUrl: './wheel.html',
  styleUrl: './wheel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wheel {
  readonly plans = input.required<DatePlan[]>();
  readonly rotation = input.required<number>();
  readonly spinning = input.required<boolean>();
  readonly spinEnd = output<void>();

  protected readonly texts = UI_TEXTS;

  protected readonly segments = computed<WheelSegment[]>(() => {
    const plans = this.plans();
    const count = plans.length;

    if (count === 0) {
      return [];
    }

    const segmentAngle = 360 / count;

    return plans.map((plan, index) => {
      const start = index * segmentAngle;
      const end = start + segmentAngle;
      const centerAngle = start + segmentAngle / 2;
      const [startX, startY] = polarPoint(start, RADIUS);
      const [endX, endY] = polarPoint(end, RADIUS);
      const largeArc = segmentAngle > 180 ? 1 : 0;
      const [labelX, labelY] = polarPoint(centerAngle, LABEL_RADIUS);
      const [emojiX, emojiY] = polarPoint(centerAngle, EMOJI_RADIUS);
      const colors = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

      return {
        id: plan.id,
        path:
          count === 1
            ? `M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER - 0.01} ${CENTER - RADIUS} Z`
            : `M ${CENTER} ${CENTER} L ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY} Z`,
        fill: colors.fill,
        textColor: colors.text,
        shortTitle: abbreviate(plan.title),
        emoji: plan.emoji ?? '✨',
        labelX,
        labelY,
        labelTransform: `rotate(${centerAngle - 90}, ${labelX}, ${labelY})`,
        emojiX,
        emojiY,
      };
    });
  });

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName === 'transform') {
      this.spinEnd.emit();
    }
  }
}
