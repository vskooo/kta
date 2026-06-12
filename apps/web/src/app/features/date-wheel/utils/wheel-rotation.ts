export interface RotationInput {
  itemCount: number;
  selectedIndex: number;
  currentRotation: number;
  extraTurns: number;
}

const FULL_TURN = 360;

export function normalizeAngle(angle: number): number {
  return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

export function segmentCenterAngle(
  itemCount: number,
  selectedIndex: number,
): number {
  const segmentAngle = FULL_TURN / itemCount;
  return (selectedIndex + 0.5) * segmentAngle;
}

export function computeWheelRotation(input: RotationInput): number {
  const { itemCount, selectedIndex, currentRotation, extraTurns } = input;

  if (!Number.isInteger(itemCount) || itemCount < 1) {
    throw new Error('itemCount must be a positive integer');
  }

  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= itemCount
  ) {
    throw new Error('selectedIndex is out of range');
  }

  if (!Number.isInteger(extraTurns) || extraTurns < 1) {
    throw new Error('extraTurns must be a positive integer');
  }

  const targetAngle = normalizeAngle(
    FULL_TURN - segmentCenterAngle(itemCount, selectedIndex),
  );
  const currentAngle = normalizeAngle(currentRotation);
  const forwardDelta = normalizeAngle(targetAngle - currentAngle);

  return currentRotation + extraTurns * FULL_TURN + forwardDelta;
}
