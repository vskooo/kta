import {
  computeWheelRotation,
  normalizeAngle,
  segmentCenterAngle,
} from './wheel-rotation';

describe('normalizeAngle', () => {
  it('keeps angles within 0 and 360', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(-90)).toBe(270);
  });
});

describe('segmentCenterAngle', () => {
  it('returns the angular center of a segment', () => {
    expect(segmentCenterAngle(4, 0)).toBe(45);
    expect(segmentCenterAngle(4, 1)).toBe(135);
    expect(segmentCenterAngle(8, 0)).toBe(22.5);
    expect(segmentCenterAngle(8, 7)).toBe(337.5);
  });
});

describe('computeWheelRotation', () => {
  it('lands the selected segment center under the top pointer', () => {
    const rotation = computeWheelRotation({
      itemCount: 4,
      selectedIndex: 1,
      currentRotation: 0,
      extraTurns: 5,
    });

    expect(normalizeAngle(rotation)).toBe(225);
    expect(normalizeAngle(rotation + segmentCenterAngle(4, 1))).toBe(0);
  });

  it('performs at least the requested number of extra turns', () => {
    const rotation = computeWheelRotation({
      itemCount: 8,
      selectedIndex: 3,
      currentRotation: 0,
      extraTurns: 5,
    });

    expect(rotation).toBeGreaterThanOrEqual(5 * 360);
  });

  it('always rotates forward from the accumulated rotation', () => {
    const current = 1875;
    const rotation = computeWheelRotation({
      itemCount: 8,
      selectedIndex: 0,
      currentRotation: current,
      extraTurns: 5,
    });

    expect(rotation).toBeGreaterThan(current + 5 * 360 - 360);
    expect(normalizeAngle(rotation + segmentCenterAngle(8, 0))).toBe(0);
  });

  it('keeps accumulating rotation across consecutive spins', () => {
    const first = computeWheelRotation({
      itemCount: 8,
      selectedIndex: 2,
      currentRotation: 0,
      extraTurns: 5,
    });
    const second = computeWheelRotation({
      itemCount: 8,
      selectedIndex: 2,
      currentRotation: first,
      extraTurns: 5,
    });

    expect(second).toBeGreaterThan(first);
    expect(normalizeAngle(second)).toBe(normalizeAngle(first));
  });

  it('rejects an out-of-range index', () => {
    expect(() =>
      computeWheelRotation({
        itemCount: 4,
        selectedIndex: 4,
        currentRotation: 0,
        extraTurns: 5,
      }),
    ).toThrowError();
  });

  it('rejects an empty wheel', () => {
    expect(() =>
      computeWheelRotation({
        itemCount: 0,
        selectedIndex: 0,
        currentRotation: 0,
        extraTurns: 5,
      }),
    ).toThrowError();
  });
});
