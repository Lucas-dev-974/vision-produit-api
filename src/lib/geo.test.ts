import { describe, it, expect } from 'vitest';
import { blurCoordinates } from './geo';

describe('blurCoordinates', () => {
  it('déplace le point dans le rayon demandé', () => {
    const lat = -21.0;
    const lng = 55.5;
    const { lat: nlat, lng: nlng } = blurCoordinates(lat, lng, 500);
    expect(Number.isFinite(nlat)).toBe(true);
    expect(Number.isFinite(nlng)).toBe(true);
    expect(Math.abs(nlat - lat)).toBeLessThan(0.05);
    expect(Math.abs(nlng - lng)).toBeLessThan(0.05);
  });
});
