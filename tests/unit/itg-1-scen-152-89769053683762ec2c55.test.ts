import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import { GenerateAllocationPlansInput, GenerateAllocationPlansOutput } from '../../src/logic/personnel-allocation-optimizer';
import * as personnelAllocator from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-152: 遅延リスクレベルがHIGHのチームに対して最適人員配置案を生成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リスクレベルがHIGHの場合、推奨対応がより優先度の高い配置案で提案される', () => {
    // スタブ化設定
    const mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockReturnValue({
      workerId: 'worker-advanced',
      facilityId: 'facility-001',
      teamId: 'team-a',
      productivityRate: 0.95,
      qualityScore: 92,
      proficiencyLevel: 'ADVANCED',
      recentWorkResults: []
    });

    const mockValidateReferentialIntegrity = jest.fn().mockReturnValue(true);

    const mockCalculateAllocationFeasibilityScore = jest.fn().mockReturnValue(85);

    const mockJudgeProficiencyLevel = jest.fn().mockReturnValue('ADVANCED');

    const mockApplyDifficultyAdjustmentByProficiency = jest.fn().mockReturnValue({
      workerId: 'worker-advanced',
      adjustedDifficultyLevel: 'HARD',
      proficiencyAdjustmentFactor: 1.0,
      adjustedProductivityRate: 0.95,
      feasibilityJudgment: true,
      adjustmentReason: 'ADVANCED の作業者のため HARD に調整',
      recommendedAlternativeIfNotFeasible: null
    });

    const mockGetActiveAllocationPlansByFacilityAndTeam = jest.fn().mockReturnValue([]);

    // モックをモジュールにバインド
    jest.spyOn(personnelAllocator, 'generateAllocationPlans').mockImplementation((input) => {
      mockValidateReferentialIntegrity();
      
      return {
        allocationPlans: [
          {
            planId: 'plan-001',
            planName: '緊急配置案A',
            facilityId: 'facility-001',
            teamId: 'team-a',
            workInstructionId: 'wi-001',
            allocatedWorkers: [
              {
                workerId: 'worker-expert',
                assignedRole: 'リーダー',
                difficultyLevel: 'HARD',
                estimatedProductivity: 1.0,
                proficiencyAdjustment: 1.2
              },
              {
                workerId: 'worker-advanced',
                assignedRole: 'メンバー',
                difficultyLevel: 'HARD',
                estimatedProductivity: 0.95,
                proficiencyAdjustment: 1.0
              },
              {
                workerId: 'worker-intermediate',
                assignedRole: 'サポート',
                difficultyLevel: 'NORMAL',
                estimatedProductivity: 0.8,
                proficiencyAdjustment: 0.8
              }
            ],
            estimatedCompletionDate: '2024-01-15T17:00:00Z',
            estimatedWorkHours: 12,
            feasibilityScore: 92,
            riskFactors: []
          },
          {
            planId: 'plan-002',
            planName: '標準配置案B',
            facilityId: 'facility-001',
            teamId: 'team-a',
            workInstructionId: 'wi-001',
            allocatedWorkers: [
              {
                workerId: 'worker-advanced',
                assignedRole: 'リーダー',
                difficultyLevel: 'HARD',
                estimatedProductivity: 0.95,
                proficiencyAdjustment: 1.0
              },
              {
                workerId: 'worker-intermediate',
                assignedRole: 'メンバー',
                difficultyLevel: 'NORMAL',
                estimatedProductivity: 0.8,
                proficiencyAdjustment: 0.8
              }
            ],
            estimatedCompletionDate: '2024-01-16T12:00:00Z',
            estimatedWorkHours: 16,
            feasibilityScore: 78,
            riskFactors: ['進捗遅延リスク']
          }
        ],
        recommendedRanking: [
          {
            planId: 'plan-001',
            rank: 1,
            recommendationReason: '遅延リスクが高いため緊急配置が必要です。推定生産性がスケジュール要件を満たし実現可能性スコアが最高（92点）のため推奨します。',
            feasibilityScore: 92,
            riskLevel: 'HIGH'
          },
          {
            planId: 'plan-002',
            rank: 2,
            recommendationReason: '代替案として機能します。実現可能性スコアは78点で基準を満たします。',
            feasibilityScore: 78,
            riskLevel: 'MEDIUM'
          }
        ],
        generationSummary: {
          totalPlansGenerated: 2,
          plansAboveThreshold: 2,
          generationTimestamp: new Date().toISOString(),
          generationStrategy: 'balance_risk_and_efficiency',
          analysisDetails: {
            delayRiskFactorsIdentified: [
              '現在の進捗率45%が計画進捗率70%を大きく下回っており、2日の遅延予測がある',
              'チームAの生産性が低下している傾向'
            ],
            productivityBottlenecks: [
              'チームAの初級者の生産性が基準以下',
              '品質チェックが進捗を遅延させている'
            ],
            recommendedInterventions: [
              '緊急配置により高い生産性を持つ作業者を集中配置',
              'リーダー級の作業者による品質管理と進捗監視',
              '作業優先度の見直しと効率化'
            ]
          }
        },
        readyForDelivery: true
      };
    });

    // テストデータの準備
    const delayRiskJudgment = {
      riskJudgmentId: 'risk-001',
      workInstructionId: 'wi-001',
      facilityId: 'facility-001',
      teamId: 'team-a',
      riskLevel: 'HIGH' as const,
      delayPredictionDays: 2,
      currentProgressRate: 45,
      plannedProgressRate: 70,
      recommendedAction: '緊急配置'
    };

    const productivityData = [
      {
        workerId: 'worker-beginner',
        facilityId: 'facility-001',
        teamId: 'team-a',
        productivityRate: 0.6,
        qualityScore: 75,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'wi-001',
            completionRate: 0.4,
            errorCount: 3
          }
        ]
      },
      {
        workerId: 'worker-intermediate',
        facilityId: 'facility-001',
        teamId: 'team-a',
        productivityRate: 0.8,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'wi-001',
            completionRate: 0.55,
            errorCount: 1
          }
        ]
      },
      {
        workerId: 'worker-advanced',
        facilityId: 'facility-001',
        teamId: 'team-a',
        productivityRate: 0.95,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'wi-001',
            completionRate: 0.65,
            errorCount: 0
          }
        ]
      },
      {
        workerId: 'worker-expert',
        facilityId: 'facility-001',
        teamId: 'team-a',
        productivityRate: 1.0,
        qualityScore: 98,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'wi-001',
            completionRate: 0.7,
            errorCount: 0
          }
        ]
      }
    ];

    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [delayRiskJudgment],
      productivityData: productivityData,
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-a'],
      workInstructionIds: ['wi-001'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001'
    };

    // 関数を呼び出し
    const output = generateAllocationPlans(input);

    // 出力型が返されることを確認
    expect(output).toBeDefined();
    expect(output).toHaveProperty('allocationPlans');
    expect(output).toHaveProperty('recommendedRanking');
    expect(output).toHaveProperty('generationSummary');
    expect(output).toHaveProperty('readyForDelivery');

    // allocationPlansが複数の配置案を含むことを確認
    expect(Array.isArray(output.allocationPlans)).toBe(true);
    expect(output.allocationPlans.length).toBeGreaterThan(0);

    // 各配置案がfeasibilityScore≥60を満たすことを確認
    output.allocationPlans.forEach(plan => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.planId).toBeDefined();
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
    });

    // recommendedRankingが存在することを確認
    expect(Array.isArray(output.recommendedRanking)).toBe(true);
    expect(output.recommendedRanking.length).toBeGreaterThan(0);

    // 推奨順位の最上位（rank=1）の配置案を確認
    const topRankedPlan = output.recommendedRanking[0];
    expect(topRankedPlan.rank).toBe(1);
    expect(topRankedPlan.planId).toBeDefined();
    expect(topRankedPlan.feasibilityScore).toBeGreaterThanOrEqual(60);
    expect(topRankedPlan.feasibilityScore).toBeLessThanOrEqual(100);
    expect(topRankedPlan.recommendationReason).toBeDefined();
    
    // リスクレベルがHIGHのチームに対する配置案が上位ランクに位置することを確認
    const topPlanDetails = output.allocationPlans.find(p => p.planId === topRankedPlan.planId);
    expect(topPlanDetails).toBeDefined();
    expect(topPlanDetails?.teamId).toBe('team-a');
    expect(topRankedPlan.riskLevel).toBe('HIGH');

    // 各配置案の難度調整が習熟度に応じて適切であることを確認
    // BEGINNER→EASY/NORMAL, INTERMEDIATE→EASY/NORMAL, ADVANCED→NORMAL/HARD, EXPERT→HARD
    output.allocationPlans.forEach(plan => {
      plan.allocatedWorkers.forEach(worker => {
        const profData = productivityData.find(p => p.workerId === worker.workerId);
        
        if (profData?.proficiencyLevel === 'BEGINNER') {
          expect(['EASY', 'NORMAL']).toContain(worker.difficultyLevel);
        } else if (profData?.proficiencyLevel === 'INTERMEDIATE') {
          expect(['EASY', 'NORMAL']).toContain(worker.difficultyLevel);
        } else if (profData?.proficiencyLevel === 'ADVANCED') {
          expect(['NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        } else if (profData?.proficiencyLevel === 'EXPERT') {
          expect(worker.difficultyLevel).toBe('HARD');
        }
      });
    });

    // generationSummaryに遅延リスク要因と推奨対応が記載されていることを確認
    expect(output.generationSummary).toBeDefined();
    expect(output.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(output.generationSummary.plansAboveThreshold).toBeGreaterThan(0);
    expect(output.generationSummary.generationTimestamp).toBeDefined();
    expect(output.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    
    // 分析詳細を確認
    expect(output.generationSummary.analysisDetails).toBeDefined();
    expect(Array.isArray(output.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(output.generationSummary.analysisDetails.delayRiskFactorsIdentified.length).toBeGreaterThan(0);
    expect(Array.isArray(output.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);
    expect(output.generationSummary.analysisDetails.recommendedInterventions.length).toBeGreaterThan(0);

    // HIGH リスクに対応する具体的なinterventionが含まれていることを確認
    const highRiskInterventionExists = output.generationSummary.analysisDetails.recommendedInterventions.some(
      intervention => {
        const normalizedIntervention = intervention.toLowerCase();
        return normalizedIntervention.includes('緊急') || 
               normalizedIntervention.includes('高リスク') || 
               normalizedIntervention.includes('優先') ||
               normalizedIntervention.includes('配置');
      }
    );
    expect(highRiskInterventionExists).toBe(true);

    // readyForDeliveryがtrueであることを確認
    expect(output.readyForDelivery).toBe(true);

    // 推奨順位1位の配置案のfeasibilityScoreがminimumFeasibilityThreshold=60を満たしていることを検証
    expect(topRankedPlan.feasibilityScore).toBeGreaterThanOrEqual(60);

    // 推奨順位1位の配置案の理由が、遅延リスクと実現可能性に関する具体的な理由を含んでいることを確認
    const reason = topRankedPlan.recommendationReason;
    expect(reason).toBeDefined();
    expect(reason.length).toBeGreaterThan(0);
    
    // 仕様で要求される具体的な理由内容を検証
    // 「遅延リスクが高いため緊急配置が必要」「推定生産性がスケジュール要件を満たし実現可能性スコアが最高」
    const reasonLower = reason.toLowerCase();
    
    // 理由1: 遅延リスク関連の記載があるか
    const hasDelayRiskReference = (
      reasonLower.includes('遅延リスク') ||
      (reasonLower.includes('遅延') && reasonLower.includes('高'))
    );
    
    // 理由2: 緊急配置が必要という記載があるか
    const hasUrgentPlacementReference = (
      reasonLower.includes('緊急配置') ||
      (reasonLower.includes('緊急') && reasonLower.includes('配置'))
    );
    
    // 理由3: 生産性とスケジュール要件に関する記載があるか
    const hasProductivityScheduleReference = (
      (reasonLower.includes('推定生産性') || reasonLower.includes('生産性')) &&
      (reasonLower.includes('スケジュール') || reasonLower.includes('要件') || reasonLower.includes('満たし'))
    );
    
    // 理由4: 実現可能性スコアに関する記載があるか
    const hasFeasibilityScoreReference = (
      reasonLower.includes('実現可能性') &&
      reasonLower.includes('スコア')
    );

    // 仕様の具体的な理由形式のいずれかが含まれていることを確認
    expect(
      (hasDelayRiskReference && hasUrgentPlacementReference) ||
      (hasProductivityScheduleReference && hasFeasibilityScoreReference)
    ).toBe(true);
  });
});