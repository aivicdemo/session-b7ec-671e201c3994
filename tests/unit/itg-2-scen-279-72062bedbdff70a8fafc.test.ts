import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-279: 融通可能人員数が必要人員数に満たないとき', () => {
  it('feasibilityJudgment の isFeasible が false で理由が返される', async () => {
    // Arrange
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['increase-personnel', 'adjust-priority'],
      },
      targetWorkTypeIds: ['worktype-A', 'worktype-B'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['site-002', 'site-003'],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85,
    };

    // Act
    const result = await judgePersonnelReallocationFeasibility(input);

    // Assert
    expect(result.feasibilityJudgment.isFeasible).toBe(false);
    expect(result.feasibilityJudgment.reason).toMatch(/融通可能人員数.*必要人員数.*満たない/);
    expect(result.feasibilityJudgment.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.feasibilityJudgment.confidenceScore).toBeLessThanOrEqual(100);
    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBe(3);
    expect(result.reallocatablePersonnelSummary.bySourceSite).toHaveLength(2);
    expect(result.reallocatablePersonnelSummary.bySourceSite[0]).toEqual(
      expect.objectContaining({ siteId: 'site-002', availableCount: 2 })
    );
    expect(result.reallocatablePersonnelSummary.bySourceSite[1]).toEqual(
      expect.objectContaining({ siteId: 'site-003', availableCount: 1 })
    );
    expect(
      result.recommendedPlacementProposals === null ||
      (Array.isArray(result.recommendedPlacementProposals) && result.recommendedPlacementProposals.length === 0)
    ).toBe(true);
    expect(result.analysisTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});