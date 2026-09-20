import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-151: 対象チームが複数指定されたとき、各チームの遅延リスクレベルに応じた配置案が生成される', () => {
  it('複数チームの遅延リスクレベルに応じた配置案が生成され、習熟度段階別の難度調整が適用される', async () => {
    // テストデータの準備：複数チーム（TeamA、TeamB、TeamC）の遅延リスク判定結果
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'rj-001',
        workInstructionId: 'WI-001',
        facilityId: 'Facility-001',
        teamId: 'TeamA',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 45,
        plannedProgressRate: 80,
        recommendedAction: 'Add 3-5 workers to accelerate completion'
      },
      {
        riskJudgmentId: 'rj-002',
        workInstructionId: 'WI-002',
        facilityId: 'Facility-001',
        teamId: 'TeamB',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 5,
        currentProgressRate: 65,
        plannedProgressRate: 75,
        recommendedAction: 'Monitor progress closely and adjust if needed'
      },
      {
        riskJudgmentId: 'rj-003',
        workInstructionId: 'WI-003',
        facilityId: 'Facility-001',
        teamId: 'TeamC',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 10,
        currentProgressRate: 80,
        plannedProgressRate: 85,
        recommendedAction: 'Continue current pace'
      }
    ];

    // 各チームに配置される作業者の生産性データ
    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'Facility-001',
        teamId: 'TeamA',
        productivityRate: 0.75,
        qualityScore: 85,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          { workInstructionId: 'WI-001', completionRate: 0.70, errorCount: 2 },
          { workInstructionId: 'WI-002', completionRate: 0.72, errorCount: 1 }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'Facility-001',
        teamId: 'TeamA',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          { workInstructionId: 'WI-001', completionRate: 0.85, errorCount: 0 },
          { workInstructionId: 'WI-003', completionRate: 0.88, errorCount: 0 }
        ]
      },
      {
        workerId: 'worker-003',
        facilityId: 'Facility-001',
        teamId: 'TeamA',
        productivityRate: 0.92,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          { workInstructionId: 'WI-001', completionRate: 0.92, errorCount: 0 },
          { workInstructionId: 'WI-002', completionRate: 0.95, errorCount: 0 }
        ]
      },
      {
        workerId: 'worker-004',
        facilityId: 'Facility-001',
        teamId: 'TeamB',
        productivityRate: 0.78,
        qualityScore: 82,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          { workInstructionId: 'WI-002', completionRate: 0.78, errorCount: 1 }
        ]
      },
      {
        workerId: 'worker-005',
        facilityId: 'Facility-001',
        teamId: 'TeamB',
        productivityRate: 0.88,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          { workInstructionId: 'WI-002', completionRate: 0.88, errorCount: 0 },
          { workInstructionId: 'WI-003', completionRate: 0.91, errorCount: 0 }
        ]
      },
      {
        workerId: 'worker-006',
        facilityId: 'Facility-001',
        teamId: 'TeamC',
        productivityRate: 0.90,
        qualityScore: 93,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          { workInstructionId: 'WI-003', completionRate: 0.90, errorCount: 0 }
        ]
      }
    ];

    // generateAllocationPlans を呼び出す
    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['Facility-001'],
      targetTeamIds: ['TeamA', 'TeamB', 'TeamC'],
      workInstructionIds: ['WI-001', 'WI-002', 'WI-003'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-manager-001'
    });

    // 戻り値の型検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('recommendedRanking');
    expect(result).toHaveProperty('generationSummary');
    expect(result).toHaveProperty('readyForDelivery');

    // allocationPlans 配列の内容を検証
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach(plan => {
      expect(plan).toHaveProperty('planId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('workInstructionId');
      expect(plan).toHaveProperty('allocatedWorkers');
      expect(plan).toHaveProperty('estimatedCompletionDate');
      expect(plan).toHaveProperty('estimatedWorkHours');
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('riskFactors');

      expect(typeof plan.planId).toBe('string');
      expect(typeof plan.facilityId).toBe('string');
      expect(typeof plan.teamId).toBe('string');
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
    });

    // 各チームの遅延リスクレベルに応じた配置案の分離を検証
    const teamAPlans = result.allocationPlans.filter(p => p.teamId === 'TeamA');
    const teamBPlans = result.allocationPlans.filter(p => p.teamId === 'TeamB');
    const teamCPlans = result.allocationPlans.filter(p => p.teamId === 'TeamC');

    expect(teamAPlans.length).toBeGreaterThan(0);
    expect(teamBPlans.length).toBeGreaterThan(0);
    expect(teamCPlans.length).toBeGreaterThan(0);

    // TeamA（HIGH リスク）の配置案を検証：workers 数が多く、難度が調整されていることを確認
    const teamAHighestFeasibility = teamAPlans.reduce((max, p) => 
      p.feasibilityScore > max.feasibilityScore ? p : max
    );
    expect(teamAHighestFeasibility.allocatedWorkers.length).toBeGreaterThanOrEqual(2);
    
    // HIGH リスクの配置案では難度が全体的に調整されていることを確認
    const teamAHasDifficultyAdjustment = teamAHighestFeasibility.allocatedWorkers.some(w => 
      w.difficultyLevel && ['EASY', 'NORMAL', 'HARD'].includes(w.difficultyLevel)
    );
    expect(teamAHasDifficultyAdjustment).toBe(true);

    // TeamB（MEDIUM リスク）の配置案を検証：中程度の workers 数
    const teamBHighestFeasibility = teamBPlans.reduce((max, p) => 
      p.feasibilityScore > max.feasibilityScore ? p : max
    );
    expect(teamBHighestFeasibility.allocatedWorkers.length).toBeGreaterThanOrEqual(1);
    expect(teamBHighestFeasibility.allocatedWorkers.length).toBeLessThanOrEqual(teamAHighestFeasibility.allocatedWorkers.length);

    // TeamC（LOW リスク）の配置案を検証：最小限の workers
    const teamCHighestFeasibility = teamCPlans.reduce((max, p) => 
      p.feasibilityScore > max.feasibilityScore ? p : max
    );
    expect(teamCHighestFeasibility.allocatedWorkers.length).toBeLessThanOrEqual(teamBHighestFeasibility.allocatedWorkers.length);

    // allocatedWorkers 内の各作業者について、proficiencyLevel に応じた difficultyLevel の調整を検証
    result.allocationPlans.forEach(plan => {
      plan.allocatedWorkers.forEach(worker => {
        expect(worker).toHaveProperty('workerId');
        expect(worker).toHaveProperty('assignedRole');
        expect(worker).toHaveProperty('difficultyLevel');
        expect(worker).toHaveProperty('estimatedProductivity');
        expect(worker).toHaveProperty('proficiencyAdjustment');

        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(typeof worker.estimatedProductivity).toBe('number');
        expect(typeof worker.proficiencyAdjustment).toBe('number');

        // proficiencyLevel に応じた難度調整ロジックを検証
        // 入力productivityDataから対応するworkerを取得して proficiencyLevel を確認
        const sourceWorker = productivityData.find(pw => pw.workerId === worker.workerId);
        if (sourceWorker) {
          // BEGINNER → EASY, INTERMEDIATE → NORMAL, ADVANCED/EXPERT → HARD のマッピングを検証
          if (sourceWorker.proficiencyLevel === 'BEGINNER') {
            expect(worker.difficultyLevel).toBe('EASY');
            expect(worker.proficiencyAdjustment).toBe(0.5);
          } else if (sourceWorker.proficiencyLevel === 'INTERMEDIATE') {
            expect(worker.difficultyLevel).toBe('NORMAL');
            expect(worker.proficiencyAdjustment).toBe(0.8);
          } else if (sourceWorker.proficiencyLevel === 'ADVANCED') {
            expect(worker.difficultyLevel).toBe('HARD');
            expect(worker.proficiencyAdjustment).toBe(1.0);
          } else if (sourceWorker.proficiencyLevel === 'EXPERT') {
            expect(worker.difficultyLevel).toBe('HARD');
            expect(worker.proficiencyAdjustment).toBe(1.2);
          }
        }

        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });
    });

    // 各配置案の feasibilityScore が minimumFeasibilityThreshold 以上であることを検証
    result.allocationPlans.forEach(plan => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
    });

    // recommendedRanking 配列の検証
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    result.recommendedRanking.forEach(rec => {
      expect(rec).toHaveProperty('planId');
      expect(rec).toHaveProperty('rank');
      expect(rec).toHaveProperty('recommendationReason');
      expect(rec).toHaveProperty('feasibilityScore');
      expect(rec).toHaveProperty('riskLevel');

      expect(typeof rec.rank).toBe('number');
      expect(rec.rank).toBeGreaterThan(0);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(rec.riskLevel);
    });

    // recommendedRanking がスコアの降順でソートされていることを検証
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      expect(result.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        result.recommendedRanking[i + 1].feasibilityScore
      );
    }

    // rank=1 が存在し、最初のランキングに対応していることを検証
    const rank1Plan = result.recommendedRanking.find(rec => rec.rank === 1);
    expect(rank1Plan).toBeDefined();
    expect(rank1Plan!.feasibilityScore).toBe(result.recommendedRanking[0].feasibilityScore);

    // HIGH リスク→MEDIUM リスク→LOW リスク の優先順序を検証
    const highRiskRanks = result.recommendedRanking.filter(rec => rec.riskLevel === 'HIGH').map(r => r.rank);
    const mediumRiskRanks = result.recommendedRanking.filter(rec => rec.riskLevel === 'MEDIUM').map(r => r.rank);
    const lowRiskRanks = result.recommendedRanking.filter(rec => rec.riskLevel === 'LOW').map(r => r.rank);

    if (highRiskRanks.length > 0 && mediumRiskRanks.length > 0) {
      expect(Math.min(...highRiskRanks)).toBeLessThan(Math.min(...mediumRiskRanks));
    }
    if (mediumRiskRanks.length > 0 && lowRiskRanks.length > 0) {
      expect(Math.min(...mediumRiskRanks)).toBeLessThan(Math.min(...lowRiskRanks));
    }

    // generationSummary を検証
    expect(result.generationSummary).toHaveProperty('totalPlansGenerated');
    expect(result.generationSummary).toHaveProperty('plansAboveThreshold');
    expect(result.generationSummary).toHaveProperty('generationTimestamp');
    expect(result.generationSummary).toHaveProperty('generationStrategy');
    expect(result.generationSummary).toHaveProperty('analysisDetails');

    expect(result.generationSummary.totalPlansGenerated).toBe(result.allocationPlans.length);
    expect(typeof result.generationSummary.plansAboveThreshold).toBe('number');
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');

    // ISO 8601 形式のタイムスタンプを検証
    expect(() => new Date(result.generationSummary.generationTimestamp)).not.toThrow();

    // analysisDetails を検証
    expect(result.generationSummary.analysisDetails).toHaveProperty('delayRiskFactorsIdentified');
    expect(result.generationSummary.analysisDetails).toHaveProperty('productivityBottlenecks');
    expect(result.generationSummary.analysisDetails).toHaveProperty('recommendedInterventions');

    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    // readyForDelivery を検証
    expect(typeof result.readyForDelivery).toBe('boolean');
    expect(result.readyForDelivery).toBe(true);

    // estimatedCompletionDate が有効な日付であり、HIGH リスクほど早い完了日であることを検証
    const teamCompletionDates: { [key: string]: Date } = {};
    result.allocationPlans.forEach(plan => {
      const completionDate = new Date(plan.estimatedCompletionDate);
      expect(completionDate.getTime()).toBeGreaterThan(0);
      if (!teamCompletionDates[plan.teamId] || completionDate < teamCompletionDates[plan.teamId]) {
        teamCompletionDates[plan.teamId] = completionDate;
      }
    });

    const teamADate = teamCompletionDates['TeamA'];
    const teamBDate = teamCompletionDates['TeamB'];
    const teamCDate = teamCompletionDates['TeamC'];

    expect(teamADate).toBeDefined();
    expect(teamBDate).toBeDefined();
    expect(teamCDate).toBeDefined();
    // HIGH リスクほど早い完了が期待される傾向を検証
    expect(teamADate!.getTime()).toBeLessThanOrEqual(teamBDate!.getTime());
    expect(teamBDate!.getTime()).toBeLessThanOrEqual(teamCDate!.getTime());

    // estimatedProductivity が productivityRate と proficiencyAdjustment を考慮して計算されていることを検証
    result.allocationPlans.forEach(plan => {
      plan.allocatedWorkers.forEach(allocatedWorker => {
        expect(typeof allocatedWorker.estimatedProductivity).toBe('number');
        expect(allocatedWorker.estimatedProductivity).toBeGreaterThan(0);
        expect(allocatedWorker.estimatedProductivity).toBeLessThanOrEqual(1.0);

        // 対応する元データのproductivityRateを取得し、proficiencyAdjustmentを考慮した計算を検証
        const sourceWorker = productivityData.find(pw => pw.workerId === allocatedWorker.workerId);
        if (sourceWorker) {
          const expectedProductivity = sourceWorker.productivityRate * allocatedWorker.proficiencyAdjustment;
          // 計算誤差を考慮した許容範囲内であることを確認
          expect(Math.abs(allocatedWorker.estimatedProductivity - expectedProductivity)).toBeLessThan(0.01);
        }
      });
    });
  });
});