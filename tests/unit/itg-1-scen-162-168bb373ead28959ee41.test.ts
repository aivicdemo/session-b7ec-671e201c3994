import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-162: 適用された生成戦略がgenerationSummaryのgenerationStrategyフィールドに記録される', () => {
  it('generationStrategy="maximize_feasibility"が明示的に指定された場合、generationSummary.generationStrategyに"maximize_feasibility"が記録されること', async () => {
    // 入力値の作成
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Increase staffing'
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'work-002',
        facilityId: 'facility-001',
        teamId: 'team-002',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 1,
        currentProgressRate: 50,
        plannedProgressRate: 65,
        recommendedAction: 'Monitor progress'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.85,
        qualityScore: 92,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.75,
            errorCount: 2
          }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.92,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.88,
            errorCount: 1
          }
        ]
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-002',
        productivityRate: 0.78,
        qualityScore: 88,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-002',
            completionRate: 0.65,
            errorCount: 4
          }
        ]
      }
    ];

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001', 'team-002'];
    const workInstructionIds = ['work-001', 'work-002'];
    const generationStrategy = 'maximize_feasibility';
    const requestedBy = 'user-001';

    // generateAllocationPlans関数を呼び出し
    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy,
      requestedBy
    });

    // 検証：generationSummary.generationStrategyが'maximize_feasibility'であること
    expect(result.generationSummary.generationStrategy).toBe('maximize_feasibility');
    
    // 追加検証：入力パラメータと完全に一致していることを確認
    expect(result.generationSummary.generationStrategy).toEqual(generationStrategy);
    
    // 生成された配置案が存在することを確認
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    
    // 推奨ランキングが存在することを確認
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
  });

  it('generationStrategyが明示的に指定されない場合、デフォルト値"balance_risk_and_efficiency"がgenerationSummary.generationStrategyに記録されること', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'work-003',
        facilityId: 'facility-002',
        teamId: 'team-003',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 0,
        currentProgressRate: 80,
        plannedProgressRate: 80,
        recommendedAction: 'Continue current pace'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-004',
        facilityId: 'facility-002',
        teamId: 'team-003',
        productivityRate: 0.88,
        qualityScore: 90,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-003',
            completionRate: 0.90,
            errorCount: 0
          }
        ]
      }
    ];

    const targetFacilityIds = ['facility-002'];
    const targetTeamIds = ['team-003'];
    const workInstructionIds = ['work-003'];
    const requestedBy = 'user-002';

    // generationStrategyを指定しない
    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      requestedBy
    });

    // 検証：generationSummary.generationStrategyがデフォルト値であること
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
  });

  it('習熟度BEGINNER作業者に対してHARD作業を割り当てた場合、難度調整ロジックによってNORMALに調整されること', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-004',
        workInstructionId: 'work-004',
        facilityId: 'facility-003',
        teamId: 'team-004',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 30,
        plannedProgressRate: 70,
        recommendedAction: 'Urgent staffing increase'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-005',
        facilityId: 'facility-003',
        teamId: 'team-004',
        productivityRate: 0.60,
        qualityScore: 75,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-004',
            completionRate: 0.50,
            errorCount: 6
          }
        ]
      }
    ];

    const targetFacilityIds = ['facility-003'];
    const targetTeamIds = ['team-004'];
    const workInstructionIds = ['work-004'];
    const generationStrategy = 'maximize_feasibility';
    const requestedBy = 'user-003';

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy,
      requestedBy
    });

    // 配置案に含まれるBEGINNER作業者の難度調整を確認
    const beginnerAllocations = result.allocationPlans.flatMap(plan =>
      plan.allocatedWorkers.filter(worker => {
        const workerData = productivityData.find(w => w.workerId === worker.workerId);
        return workerData?.proficiencyLevel === 'BEGINNER';
      })
    );

    // BEGINNER作業者が配置されている場合、難度がHARDでないことを確認
    beginnerAllocations.forEach(allocation => {
      expect(['EASY', 'NORMAL']).toContain(allocation.difficultyLevel);
    });
  });

  it('複数の生成戦略を試した場合、各結果のgenerationStrategyが指定した戦略と一致していること', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-005',
        workInstructionId: 'work-005',
        facilityId: 'facility-004',
        teamId: 'team-005',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 1,
        currentProgressRate: 55,
        plannedProgressRate: 75,
        recommendedAction: 'Moderate staffing adjustment'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-006',
        facilityId: 'facility-004',
        teamId: 'team-005',
        productivityRate: 0.80,
        qualityScore: 88,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-005',
            completionRate: 0.80,
            errorCount: 1
          }
        ]
      }
    ];

    const targetFacilityIds = ['facility-004'];
    const targetTeamIds = ['team-005'];
    const workInstructionIds = ['work-005'];
    const requestedBy = 'user-004';

    const strategies: Array<'maximize_feasibility' | 'minimize_cost' | 'balance_risk_and_efficiency'> = [
      'maximize_feasibility',
      'minimize_cost',
      'balance_risk_and_efficiency'
    ];

    for (const strategy of strategies) {
      const result = await generateAllocationPlans({
        delayRiskJudgments,
        productivityData,
        targetFacilityIds,
        targetTeamIds,
        workInstructionIds,
        generationStrategy: strategy,
        requestedBy
      });

      expect(result.generationSummary.generationStrategy).toBe(strategy);
    }
  });
});