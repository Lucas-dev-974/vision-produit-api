import { describe, expect, it } from 'vitest';
import { computeSurveyLeadTier } from './survey-lead-tier';

describe('computeSurveyLeadTier', () => {
  it('classifies explicit decline as out', () => {
    expect(
      computeSurveyLeadTier({ platformInterest: 'no', paymentWillingness: 'plus50' }, true),
    ).toBe('out');
  });

  it('classifies hot: yes + recontact + paid bracket', () => {
    expect(
      computeSurveyLeadTier({ platformInterest: 'yes', paymentWillingness: '10_30' }, true),
    ).toBe('hot');
  });

  it('classifies hot with commission model', () => {
    expect(
      computeSurveyLeadTier({ platformInterest: 'yes', paymentWillingness: 'commission' }, true),
    ).toBe('hot');
  });

  it('yes + recontact but free only → warm', () => {
    expect(
      computeSurveyLeadTier({ platformInterest: 'yes', paymentWillingness: 'free' }, true),
    ).toBe('warm');
  });

  it('yes + paid but no recontact → warm', () => {
    expect(
      computeSurveyLeadTier({ platformInterest: 'yes', paymentWillingness: '10_30' }, false),
    ).toBe('warm');
  });

  it('maybe → warm', () => {
    expect(computeSurveyLeadTier({ platformInterest: 'maybe' }, false)).toBe('warm');
  });

  it('missing interest → cold', () => {
    expect(computeSurveyLeadTier({ paymentWillingness: 'plus50' }, true)).toBe('cold');
  });
});
