import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-266: 遅延リスク検知時に複数融通元から融通可能人員を判定し推奨配置案を生成', () => {
  it('進捗遅延リスク検知時に、複数の融通元候補拠点から融通可能人員を判定し、推奨配置案を生成して提示される', async () => {
    const input = {
      delayRiskContext: {
        affectedSiteId: 'SITE-A',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_allocation']
      },
      targetWorkTypeIds: ['WT-001', 'WT-002'],
      requiredPersonnelCount: 5,
      candidateSiteIds: ['SITE-B', 'SITE-C', 'SITE-D'],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    // feasibilityJudgment検証
    expect(result.feasibilityJudgment).toBeDefined();
    expect(result.feasibilityJudgment.isFeasible).toBe(true);
    expect(result.feasibilityJudgment.reason).toContain('複数拠点からの人員融通で必要人員数5名を確保可能');
    expect(result.feasibilityJudgment.confidenceScore).toBeGreaterThanOrEqual(85);
    expect(result.feasibilityJudgment.confidenceScore).toBeLessThanOrEqual(100);

    // reallocatablePersonnelSummary検証
    expect(result.reallocatablePersonnelSummary).toBeDefined();
    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBeGreaterThanOrEqual(5);
    expect(result.reallocatablePersonnelSummary.bySourceSite).toHaveLength(2);
    
    const siteBSource = result.reallocatablePersonnelSummary.bySourceSite.find(
      s => s.siteId === 'SITE-B'
    );
    expect(siteBSource).toBeDefined();
    expect(siteBSource?.availableCount).toBe(5);
    expect(siteBSource?.workloadAfterReallocation).toBeGreaterThan(70);
    expect(siteBSource?.workloadAfterReallocation).toBeLessThanOrEqual(85);

    const siteCSource = result.reallocatablePersonnelSummary.bySourceSite.find(
      s => s.siteId === 'SITE-C'
    );
    expect(siteCSource).toBeDefined();
    expect(siteCSource?.availableCount).toBe(3);
    expect(siteCSource?.workloadAfterReallocation).toBeGreaterThan(65);
    expect(siteCSource?.workloadAfterReallocation).toBeLessThanOrEqual(85);

    // recommendedPlacementProposals検証
    expect(result.recommendedPlacementProposals).toBeDefined();
    expect(result.recommendedPlacementProposals.length).toBeGreaterThanOrEqual(2);

    const proposal1 = result.recommendedPlacementProposals[0];
    expect(proposal1.proposalId).toBeDefined();
    expect(['SITE-B', 'SITE-C']).toContain(proposal1.sourceSiteId);
    expect(proposal1.targetSiteId).toBe('SITE-A');
    expect(proposal1.assignedWorkerIds).toBeDefined();
    expect(proposal1.assignedWorkerIds.length).toBeGreaterThan(0);
    expect(proposal1.skillMatchDegrees).toBeDefined();
    for (const workerId of proposal1.assignedWorkerIds) {
      expect(proposal1.skillMatchDegrees[workerId]).toBeGreaterThanOrEqual(50);
      expect(proposal1.skillMatchDegrees[workerId]).toBeLessThanOrEqual(100);
    }
    expect(proposal1.expectedProductivityImprovement).toBeGreaterThan(0);
    expect(proposal1.expectedProductivityImprovement).toBeLessThanOrEqual(100);
    expect(proposal1.deliveryMarginAfterReallocation).toBeGreaterThan(0);
    expect(proposal1.riskMitigation).toBeDefined();
    expect(proposal1.riskMitigation.length).toBeGreaterThan(0);

    // alternativeProposals検証
    expect(result.alternativeProposals).toBeDefined();
    expect(result.alternativeProposals).not.toBeNull();
    if (result.alternativeProposals && result.alternativeProposals.length > 0) {
      for (const altProposal of result.alternativeProposals) {
        expect(altProposal.proposalId).toBeDefined();
        expect(altProposal.description).toBeDefined();
        expect(altProposal.feasibilityScore).toBeGreaterThanOrEqual(0);
        expect(altProposal.feasibilityScore).toBeLessThanOrEqual(100);
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(altProposal.riskLevel);
      }
    }

    // dataQualityWarnings検証
    if (result.dataQualityWarnings !== null && result.dataQualityWarnings !== undefined) {
      expect(Array.isArray(result.dataQualityWarnings)).toBe(true);
    }

    // analysisTimestamp検証
    expect(result.analysisTimestamp).toBeDefined();
    const timestamp = new Date(result.analysisTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });
});