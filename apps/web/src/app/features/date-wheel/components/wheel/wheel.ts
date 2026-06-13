import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { UI_TEXTS } from '../../../../core/config/texts';
import { DatePlan } from '../../../../core/models/date-plan.model';

interface WheelLabelLine {
  text: string;
  dy: string;
}

interface WheelSegment {
  id: string;
  path: string;
  fill: string;
  textColor: string;
  lines: WheelLabelLine[];
  emoji: string;
  labelX: number;
  labelY: number;
  labelTransform: string;
  emojiX: number;
  emojiY: number;
}

const CENTER = 180;
const RADIUS = 172;
const LABEL_RADIUS = 102;
const EMOJI_RADIUS = 152;
const SINGLE_LINE_MAX_LENGTH = 13;

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

function wrapLabel(title: string): string[] {
  const trimmed = title.trim();
  const words = trimmed.split(/\s+/);

  if (trimmed.length <= SINGLE_LINE_MAX_LENGTH || words.length === 1) {
    return [trimmed];
  }

  let bestSplit: [string, string] = [words[0], words.slice(1).join(' ')];
  let bestScore = Infinity;

  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(' ');
    const second = words.slice(i).join(' ');
    const score = Math.max(first.length, second.length);

    if (score < bestScore) {
      bestScore = score;
      bestSplit = [first, second];
    }
  }

  return bestSplit;
}

function buildLabelLines(title: string): WheelLabelLine[] {
  const lines = wrapLabel(title);

  if (lines.length === 1) {
    return [{ text: lines[0], dy: '0' }];
  }

  return [
    { text: lines[0], dy: '-0.55em' },
    { text: lines[1], dy: '1.1em' },
  ];
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
      const flipped = centerAngle > 90 && centerAngle < 270;
      const labelAngle = flipped ? centerAngle + 90 : centerAngle - 90;

      return {
        id: plan.id,
        path:
          count === 1
            ? `M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER - 0.01} ${CENTER - RADIUS} Z`
            : `M ${CENTER} ${CENTER} L ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY} Z`,
        fill: colors.fill,
        textColor: colors.text,
        lines: buildLabelLines(plan.title),
        emoji: plan.emoji ?? '✨',
        labelX,
        labelY,
        labelTransform: `rotate(${labelAngle}, ${labelX}, ${labelY})`,
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
