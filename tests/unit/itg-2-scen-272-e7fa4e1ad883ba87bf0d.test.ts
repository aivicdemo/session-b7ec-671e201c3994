import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-272: 人員融通可否の自動判定', () => {
  it('融通元拠点の作業負荷と納期余裕度の閾値判定、スキルマッチ度の順序付け、必要人員数に達するまでの積み上げが正しく実行される', async () => {
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-A',
        delayRiskScore: 75,
        detectedAt: '2025-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_transfer'],
      },
      targetWorkTypeIds: ['wt-001', 'wt-002'],
      requiredPersonnelCount: 3,
      candidateSiteIds: ['site-B', 'site-C', 'site-D'],
      analysisDate: '2025-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(result.feasibilityJudgment.isFeasible).toBe(true);
    expect(result.feasibilityJudgment.reason).toBe('融通可能');

    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBeGreaterThanOrEqual(3);

    expect(result.recommendedPlacementProposals).toHaveLength(1);
    const proposal = result.recommendedPlacementProposals[0];

    expect(proposal.sourceSiteId).toBe('site-B');
    expect(proposal.targetSiteId).toBe('site-A');
    expect(proposal.assignedWorkerIds).toContain('worker-B1');
    expect(proposal.assignedWorkerIds).toContain('worker-B2');
    expect(proposal.assignedWorkerIds).toContain('worker-B3');
    expect(proposal.assignedWorkerIds).toHaveLength(3);

    const b1Match = proposal.skillMatchDegrees['worker-B1'];
    const b2Match = proposal.skillMatchDegrees['worker-B2'];
    const b3Match = proposal.skillMatchDegrees['worker-B3'];
    expect(b1Match).toBe(85);
    expect(b2Match).toBe(80);
    expect(b3Match).toBe(70);
    expect(b1Match).toBeGreaterThanOrEqual(b2Match);
    expect(b2Match).toBeGreaterThanOrEqual(b3Match);

    expect(proposal.workloadAfterReallocation).toBeLessThan(105);
    expect(proposal.deliveryMarginAfterReallocation).toBeGreaterThan(0);

    expect(
      result.recommendedPlacementProposals.every(
        (p) =>
          p.assignedWorkerIds.length <= 3 &&
          p.skillMatchDegrees &&
          Object.values(p.skillMatchDegrees).every((score) => score >= 50)
      )
    ).toBe(true);

    expect(result.alternativeProposals === null || result.alternativeProposals?.length === 0).toBe(true);
    expect(result.dataQualityWarnings === null || result.dataQualityWarnings?.length === 0).toBe(true);

    expect(result.analysisTimestamp).toMatch(/2025-01-15/);
  });
});