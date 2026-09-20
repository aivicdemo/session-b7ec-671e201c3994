import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import { GenerateAllocationPlansInput, GenerateAllocationPlansOutput } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-159: 生産性ボトルネック分析と人員配置案生成', () => {
  it('生産性ボトルネックが分析され、generationSummaryのproductivityBottlenecksに記録される', async () => {
    // テスト前提：遅延リスク判定結果と作業者生産性データを含むInputを構築
    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RJ-001',
          workInstructionId: 'WI-001',
          facilityId: 'FC-01',
          teamId: 'T-01',
          riskLevel: 'HIGH',
          delayPredictionDays: 3,
          currentProgressRate: 40,
          plannedProgressRate: 60,
          recommendedAction: '人員追加配置が必要'
        },
        {
          riskJudgmentId: 'RJ-002',
          workInstructionId: 'WI-002',
          facilityId: 'FC-05',
          teamId: 'T-12',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 1,
          currentProgressRate: 55,
          plannedProgressRate: 70,
          recommendedAction: '作業優先度の調整が必要'
        }
      ],
      productivityData: [
        {
          workerId: 'W-001',
          facilityId: 'FC-01',
          teamId: 'T-01',
          productivityRate: 0.5,
          qualityScore: 65,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: 'WI-001',
              completionRate: 0.4,
              errorCount: 5
            }
          ]
        },
        {
          workerId: 'W-002',
          facilityId: 'FC-01',
          teamId: 'T-01',
          productivityRate: 0.55,
          qualityScore: 68,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: 'WI-001',
              completionRate: 0.35,
              errorCount: 4
            }
          ]
        },
        {
          workerId: 'W-003',
          facilityId: 'FC-01',
          teamId: 'T-01',
          productivityRate: 0.8,
          qualityScore: 85,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            {
              workInstructionId: 'WI-001',
              completionRate: 0.75,
              errorCount: 1
            }
          ]
        },
        {
          workerId: 'W-004',
          facilityId: 'FC-05',
          teamId: 'T-12',
          productivityRate: 0.65,
          qualityScore: 70,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            {
              workInstructionId: 'WI-002',
              completionRate: 0.6,
              errorCount: 3
            }
          ]
        },
        {
          workerId: 'W-005',
          facilityId: 'FC-05',
          teamId: 'T-12',
          productivityRate: 0.7,
          qualityScore: 72,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            {
              workInstructionId: 'WI-002',
              completionRate: 0.65,
              errorCount: 2
            }
          ]
        }
      ],
      targetFacilityIds: ['FC-01', 'FC-05'],
      targetTeamIds: ['T-01', 'T-12'],
      workInstructionIds: ['WI-001', 'WI-002'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-test-001'
    };

    // generateAllocationPlans操作を呼び出し
    const result: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // generationSummaryフィールドを取得し、analysisDetailsを確認
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(result.generationSummary.analysisDetails.productivityBottlenecks).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);

    // productivityBottlenecks配列に少なくとも1件以上の生産性ボトルネック識別結果が記録されていることを検証
    expect(result.generationSummary.analysisDetails.productivityBottlenecks.length).toBeGreaterThan(0);

    // 各要素が文字列形式で、作業指示ごと・チームごとの生産性低下要因を記述していることを検証
    result.generationSummary.analysisDetails.productivityBottlenecks.forEach((bottleneck) => {
      expect(typeof bottleneck).toBe('string');
      expect(bottleneck.length).toBeGreaterThan(0);
      // ボトルネック記述に作業指示ID、チームID、または拠点IDが含まれていることを確認
      const containsIdentifier = 
        bottleneck.includes('WI-') || 
        bottleneck.includes('T-') || 
        bottleneck.includes('FC-') ||
        bottleneck.includes('workInstructionId') ||
        bottleneck.includes('teamId') ||
        bottleneck.includes('facilityId');
      expect(containsIdentifier).toBe(true);
    });

    // totalPlansGeneratedとplansAboveThresholdが0より大きい数値であることを検証
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThan(0);

    // generationTimestampがISO 8601形式のタイムスタンプ文字列であることを検証
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.generationSummary.generationTimestamp).toMatch(iso8601Regex);

    // allocationPlans配列の各要素から、allocatedWorkers内の作業者ごとにestimatedProductivityとproficiencyAdjustmentが設定されていることを検証
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach((plan) => {
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      
      plan.allocatedWorkers.forEach((worker) => {
        // estimatedProductivityが設定されていることを確認
        expect(worker.estimatedProductivity).toBeDefined();
        expect(typeof worker.estimatedProductivity).toBe('number');
        expect(worker.estimatedProductivity).toBeGreaterThanOrEqual(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(1);

        // proficiencyAdjustmentが設定されていることを確認
        expect(worker.proficiencyAdjustment).toBeDefined();
        expect(typeof worker.proficiencyAdjustment).toBe('number');
        // 習熟度段階別難度調整ロジックの係数範囲：BEGINNER=0.5, INTERMEDIATE=0.8, ADVANCED=1.0, EXPERT=1.2
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });
    });

    // 推奨順位が設定されていることを検証
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.planId).toBeDefined();
      expect(typeof ranking.rank).toBe('number');
      expect(ranking.rank).toBeGreaterThan(0);
      expect(ranking.recommendationReason).toBeDefined();
      expect(typeof ranking.recommendationReason).toBe('string');
      expect(ranking.feasibilityScore).toBeDefined();
      expect(typeof ranking.feasibilityScore).toBe('number');
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
    });

    // readyForDeliveryが真値であることを確認
    expect(result.readyForDelivery).toBeDefined();
    expect(typeof result.readyForDelivery).toBe('boolean');
  });
});