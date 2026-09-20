import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';
import * as personnelModule from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-283: skillMatchThreshold パラメータが指定されないとき、デフォルト値の50を使用してスキルマッチ度の最小閾値判定が行われる', () => {
  it('skillMatchThresholdが省略されたときデフォルト値50でスキルマッチ度判定が行われる', async () => {
    const validateInputDataSpy = jest.spyOn(personnelModule, 'validateInputData' as any).mockResolvedValue(undefined);
    
    const calculateWorkloadAndCapacityBySiteSpy = jest.spyOn(personnelModule, 'calculateWorkloadAndCapacityBysite' as any).mockImplementation((siteId: string) => {
      if (siteId === 'site-B') {
        return Promise.resolve({
          siteId: 'site-B',
          currentWorkload: 75,
          totalCapacityMinutes: 8000,
          usedCapacityMinutes: 6000,
          availableCapacityMinutes: 2000,
          activeWorkerCount: 8,
          totalWorkerCount: 10,
          averageProductivityRate: 85,
          dataQualityScore: 90,
          calculatedAt: '2024-01-15T10:00:00Z',
        });
      } else if (siteId === 'site-C') {
        return Promise.resolve({
          siteId: 'site-C',
          currentWorkload: 65,
          totalCapacityMinutes: 9000,
          usedCapacityMinutes: 5850,
          availableCapacityMinutes: 3150,
          activeWorkerCount: 7,
          totalWorkerCount: 10,
          averageProductivityRate: 80,
          dataQualityScore: 88,
          calculatedAt: '2024-01-15T10:00:00Z',
        });
      }
      return Promise.reject(new Error(`Unknown site: ${siteId}`));
    });

    const assessDeliveryMarginBySiteSpy = jest.spyOn(personnelModule, 'assessDeliveryMarginBySite' as any).mockImplementation((siteId: string) => {
      if (siteId === 'site-B') {
        return Promise.resolve({
          siteId: 'site-B',
          deliveryDate: '2024-01-25T00:00:00Z',
          remainingDays: 10,
          remainingHours: 240,
          currentProgressRate: 60,
          requiredProgressRatePerDay: 4,
          deliveryMarginScore: 120,
          marginLevel: 'safe',
          assessedAt: '2024-01-15T10:00:00Z',
        });
      } else if (siteId === 'site-C') {
        return Promise.resolve({
          siteId: 'site-C',
          deliveryDate: '2024-01-25T00:00:00Z',
          remainingDays: 10,
          remainingHours: 240,
          currentProgressRate: 50,
          requiredProgressRatePerDay: 5,
          deliveryMarginScore: 180,
          marginLevel: 'safe',
          assessedAt: '2024-01-15T10:00:00Z',
        });
      }
      return Promise.reject(new Error(`Unknown site: ${siteId}`));
    });

    const identifyReallocatablePersonnelAndSourcesSpy = jest.spyOn(personnelModule, 'identifyReallocatablePersonnelAndSources' as any).mockResolvedValue({
      reallocatableSources: [
        {
          siteId: 'site-B',
          availablePersonnelCount: 3,
          priorityScore: 80,
          workloadAfterReallocation: 72,
          deliveryMarginAfterReallocation: 110,
          recommendedWorkerIds: ['w-b1', 'w-b2', 'w-b3'],
          skillMatchDegrees: {
            'w-b1': 55,
            'w-b2': 52,
            'w-b3': 48,
          },
          riskFactors: [],
        },
        {
          siteId: 'site-C',
          availablePersonnelCount: 2,
          priorityScore: 75,
          workloadAfterReallocation: 68,
          deliveryMarginAfterReallocation: 170,
          recommendedWorkerIds: ['w-c1', 'w-c2'],
          skillMatchDegrees: {
            'w-c1': 75,
            'w-c2': 70,
          },
          riskFactors: [],
        },
      ],
      totalAvailablePersonnelCount: 5,
      isSufficientCapacity: true,
      dataQualityWarnings: null,
      identifiedAt: '2024-01-15T10:00:00Z',
    });

    const evaluateSkillMatchDegreeSpy = jest.spyOn(personnelModule, 'evaluateSkillMatchDegree' as any).mockImplementation((workerId: string) => {
      const matchDegrees: { [key: string]: number } = {
        'w-b1': 55,
        'w-b2': 52,
        'w-b3': 48,
        'w-c1': 75,
        'w-c2': 70,
      };
      const matchDegree = matchDegrees[workerId] || 0;
      const matchLevel = matchDegree >= 75 ? 'excellent' : matchDegree >= 60 ? 'good' : matchDegree >= 50 ? 'acceptable' : 'poor';
      return Promise.resolve({
        sourceWorkerId: workerId,
        targetWorkTypeId: 'wt-001',
        matchDegree,
        matchLevel,
        evaluationFactors: {
          jobTypeAlignment: matchDegree,
          productivityAlignment: matchDegree - 5,
          difficultyAlignment: matchDegree - 10,
          experienceRelevance: matchDegree,
        },
        matchingJustification: `Skill match assessment for ${workerId}`,
        riskFactors: matchDegree < 50 ? ['Low skill match'] : [],
        evaluatedAt: '2024-01-15T10:00:00Z',
      });
    });

    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-A',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_increase'],
      },
      targetWorkTypeIds: ['wt-001', 'wt-002'],
      requiredPersonnelCount: 3,
      candidateSiteIds: ['site-B', 'site-C'],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
    };

    const result = await judgePersonnelReallocationFeasibility(input);

    expect(validateInputDataSpy).toHaveBeenCalled();
    expect(calculateWorkloadAndCapacityBySiteSpy).toHaveBeenCalled();
    expect(assessDeliveryMarginBySiteSpy).toHaveBeenCalled();
    expect(identifyReallocatablePersonnelAndSourcesSpy).toHaveBeenCalled();
    expect(evaluateSkillMatchDegreeSpy).toHaveBeenCalled();

    expect(result.feasibilityJudgment.isFeasible).toBe(true);
    
    const reasonKeywords = ['最小閾値', '50', 'スキルマッチ度', '必要人員', '3', '確保'];
    reasonKeywords.forEach(keyword => {
      expect(result.feasibilityJudgment.reason).toContain(keyword);
    });
    
    expect(result.reallocatablePersonnelSummary.totalAvailableCount).toBe(5);
    
    expect(result.recommendedPlacementProposals).toBeDefined();
    expect(result.recommendedPlacementProposals.length).toBeGreaterThan(0);
    
    const placedWorkerIds = result.recommendedPlacementProposals.flatMap(p => p.assignedWorkerIds);
    expect(placedWorkerIds).toContain('w-c1');
    expect(placedWorkerIds).toContain('w-c2');
    expect(placedWorkerIds).toContain('w-b1');
    expect(placedWorkerIds).not.toContain('w-b3');
    
    const matchDegrees = result.recommendedPlacementProposals.flatMap(p => 
      Object.values(p.skillMatchDegrees || {})
    );
    const minMatchDegree = Math.min(...matchDegrees);
    expect(minMatchDegree).toBeGreaterThanOrEqual(50);
    
    // Verify proposals are in expected order: w-c1 (75%), w-c2 (70%), w-b1 (55%)
    const proposalsByWorker = new Map<string, number>();
    result.recommendedPlacementProposals.forEach(proposal => {
      proposal.assignedWorkerIds.forEach(workerId => {
        const degree = proposal.skillMatchDegrees?.[workerId] || 0;
        proposalsByWorker.set(workerId, degree);
      });
    });
    
    expect(proposalsByWorker.get('w-c1')).toBe(75);
    expect(proposalsByWorker.get('w-c2')).toBe(70);
    expect(proposalsByWorker.get('w-b1')).toBe(55);
    
    // Verify descending order of skill match degrees across all proposals
    const allWorkerDegrees: number[] = [];
    result.recommendedPlacementProposals.forEach(proposal => {
      proposal.assignedWorkerIds.forEach(workerId => {
        allWorkerDegrees.push(proposal.skillMatchDegrees?.[workerId] || 0);
      });
    });
    
    for (let i = 1; i < allWorkerDegrees.length; i++) {
      expect(allWorkerDegrees[i]).toBeLessThanOrEqual(allWorkerDegrees[i - 1]);
    }
    
    // Verify worker degree order matches expected: 75, 70, 55
    expect(allWorkerDegrees).toEqual([75, 70, 55]);
    
    expect(result.analysisTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    validateInputDataSpy.mockRestore();
    calculateWorkloadAndCapacityBySiteSpy.mockRestore();
    assessDeliveryMarginBySiteSpy.mockRestore();
    identifyReallocatablePersonnelAndSourcesSpy.mockRestore();
    evaluateSkillMatchDegreeSpy.mockRestore();
  });
});