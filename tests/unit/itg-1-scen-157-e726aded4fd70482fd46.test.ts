import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import * as allocationOptimizer from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-157: 人員配置案のリスク要因抽出と推奨順位付与', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 対象となるスタブ処理をすべてモック化
    jest.spyOn(allocationOptimizer, 'validateReferentialIntegrity' as any).mockResolvedValue(true);
    jest.spyOn(allocationOptimizer, 'calculateAllocationFeasibilityScore' as any).mockResolvedValue(75);
    jest.spyOn(allocationOptimizer, 'judgeProficiencyLevel' as any).mockResolvedValue('INTERMEDIATE');
    jest.spyOn(allocationOptimizer, 'applyDifficultyAdjustmentByProficiency' as any).mockResolvedValue({
      adjustedDifficultyLevel: 'NORMAL',
      proficiencyAdjustmentFactor: 0.8,
      adjustedProductivityRate: 0.8,
      feasibilityJudgment: true
    });
    jest.spyOn(allocationOptimizer, 'getWorkerWithProficiencyAndProductivity' as any).mockResolvedValue({
      workerId: 'worker-001',
      productivityRate: 0.85,
      proficiencyLevel: 'INTERMEDIATE'
    });
    jest.spyOn(allocationOptimizer, 'getActiveAllocationPlansByFacilityAndTeam' as any).mockResolvedValue([]);
  });

  it('should extract and record risk factors in allocation plans and recommended ranking', async () => {
    // テスト用の入力データを準備
    const highRiskJudgment = {
      riskJudgmentId: 'risk-001',
      workInstructionId: 'work-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      riskLevel: 'HIGH' as const,
      delayPredictionDays: 5,
      currentProgressRate: 30,
      plannedProgressRate: 60,
      recommendedAction: '追加人員を配置して進捗を加速する'
    };

    const mediumRiskJudgment = {
      riskJudgmentId: 'risk-002',
      workInstructionId: 'work-002',
      facilityId: 'facility-001',
      teamId: 'team-002',
      riskLevel: 'MEDIUM' as const,
      delayPredictionDays: 3,
      currentProgressRate: 50,
      plannedProgressRate: 70,
      recommendedAction: '作業優先順位を調整する'
    };

    const delayRiskJudgments = [highRiskJudgment, mediumRiskJudgment];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 1
          }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-002',
        productivityRate: 0.80,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-002',
            completionRate: 0.75,
            errorCount: 2
          }
        ]
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.70,
        qualityScore: 78,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.60,
            errorCount: 3
          }
        ]
      }
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001', 'team-002'],
      workInstructionIds: ['work-001', 'work-002'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001'
    };

    // 関数を直接呼び出す
    const result = await generateAllocationPlans(input);

    // 戻り値が正常に返却されていることを確認
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);

    // allocationPlans配列の各要素がriskFactorsフィールドを持つことを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('riskFactors');
      expect(Array.isArray(plan.riskFactors)).toBe(true);
    });

    // recommendedRanking配列の各要素がriskFactorsフィールドを持つことを確認
    result.recommendedRanking.forEach((ranking) => {
      expect(ranking).toHaveProperty('riskFactors');
      expect(Array.isArray(ranking.riskFactors)).toBe(true);
    });

    // 最上位（rank=1）の推奨案を取得
    const topRecommendation = result.recommendedRanking.find(r => r.rank === 1);
    expect(topRecommendation).toBeDefined();
    expect(topRecommendation!.riskFactors.length).toBeGreaterThan(0);

    // 最上位の推奨案のriskFactorsがdelayRiskJudgmentsから抽出されたリスク要因を含むことを確認
    const topRiskFactors = topRecommendation!.riskFactors;
    
    // リスク判定IDを含むリスク要因が存在するか確認
    const hasRiskJudgmentReference = topRiskFactors.some(factor =>
      delayRiskJudgments.some(judgment =>
        factor.includes(judgment.riskJudgmentId) && factor.includes(judgment.riskLevel)
      )
    );
    expect(hasRiskJudgmentReference).toBe(true);

    // 進捗率情報が含まれることを確認
    const hasProgressInfo = topRiskFactors.some(factor =>
      factor.includes('進捗率') || 
      delayRiskJudgments.some(judgment =>
        factor.includes(judgment.currentProgressRate.toString()) ||
        factor.includes(judgment.plannedProgressRate.toString())
      )
    );
    expect(hasProgressInfo).toBe(true);

    // 推奨対応が含まれることを確認
    const hasRecommendedAction = topRiskFactors.some(factor =>
      delayRiskJudgments.some(judgment =>
        factor.includes(judgment.recommendedAction)
      )
    );
    expect(hasRecommendedAction).toBe(true);

    // 各配置案のriskFactorsが、その配置案の対象チーム・作業指示に紐付くリスク要因のみを含むことを確認
    result.allocationPlans.forEach((plan) => {
      const planTeamId = plan.teamId;
      const planWorkInstructionId = plan.workInstructionId;

      // この配置案に対応するdelayRiskJudgmentを特定
      const relevantRisks = delayRiskJudgments.filter(
        risk => risk.teamId === planTeamId && risk.workInstructionId === planWorkInstructionId
      );

      // relevantRisksが存在する場合、plan.riskFactorsにはこれらのリスク要因が記録されていることを確認
      if (relevantRisks.length > 0) {
        expect(plan.riskFactors.length).toBeGreaterThan(0);
        
        // 各relevantRiskについて、対応するリスク要因がplan.riskFactorsに含まれることを確認
        relevantRisks.forEach(risk => {
          const hasRiskIndicator = plan.riskFactors.some(
            factor => factor.includes(risk.riskJudgmentId) && 
                       factor.includes(risk.riskLevel)
          );
          expect(hasRiskIndicator).toBe(true);

          // リスク要因に進捗率情報が含まれることを確認
          const hasProgressData = plan.riskFactors.some(
            factor => factor.includes(risk.currentProgressRate.toString()) ||
                      factor.includes(risk.plannedProgressRate.toString()) ||
                      factor.includes('進捗率')
          );
          expect(hasProgressData).toBe(true);

          // リスク要因に推奨対応が含まれることを確認
          const hasRecommendation = plan.riskFactors.some(
            factor => factor.includes(risk.recommendedAction)
          );
          expect(hasRecommendation).toBe(true);
        });

        // 無関係なリスク要因（異なるteamId または異なるworkInstructionId）が含まれていないことを確認
        const irrelevantRisks = delayRiskJudgments.filter(
          risk => !(risk.teamId === planTeamId && risk.workInstructionId === planWorkInstructionId)
        );
        irrelevantRisks.forEach(irrelevantRisk => {
          const hasIrrelevantRisk = plan.riskFactors.some(
            factor => factor.includes(irrelevantRisk.riskJudgmentId)
          );
          expect(hasIrrelevantRisk).toBe(false);
        });
      } else {
        // relevantRisksが存在しない場合、riskFactorsは空配列であることを確認
        expect(plan.riskFactors.length).toBe(0);
      }
    });

    // 複数の配置案が生成されている場合、異なる配置案のriskFactorsの内容が異なることを確認
    if (result.allocationPlans.length > 1) {
      // team-001に対応する配置案とteam-002に対応する配置案を取得
      const team001Plans = result.allocationPlans.filter(p => p.teamId === 'team-001');
      const team002Plans = result.allocationPlans.filter(p => p.teamId === 'team-002');

      if (team001Plans.length > 0 && team002Plans.length > 0) {
        // team-001のプランはHIGHリスク判定を反映
        const hasTeam001HighRisk = team001Plans[0].riskFactors.some(
          f => f.includes('HIGH') && f.includes('risk-001')
        );
        expect(hasTeam001HighRisk).toBe(true);

        // team-002のプランはMEDIUMリスク判定を反映
        const hasTeam002MediumRisk = team002Plans[0].riskFactors.some(
          f => f.includes('MEDIUM') && f.includes('risk-002')
        );
        expect(hasTeam002MediumRisk).toBe(true);

        // 2つの配置案のriskFactorsの内容が異なることを確認
        const team001Content = team001Plans[0].riskFactors.join('|');
        const team002Content = team002Plans[0].riskFactors.join('|');
        expect(team001Content).not.toBe(team002Content);
      }

      // 同一チーム内で複数の配置案が生成されている場合、riskFactorsが同じであることを確認
      if (team001Plans.length > 1) {
        const firstPlanRisks = team001Plans[0].riskFactors.sort().join('|');
        const secondPlanRisks = team001Plans[1].riskFactors.sort().join('|');
        // 同じチーム・作業指示に対応する配置案のリスク要因は同一
        expect(firstPlanRisks).toBe(secondPlanRisks);
      }
    }

    // readyForDeliveryの状態に関わらず、すべての配置案に対して、対応するdelayRiskJudgmentが存在する場合はriskFactorsが完全に抽出・記録されていることを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.riskFactors).toBeDefined();
      expect(Array.isArray(plan.riskFactors)).toBe(true);

      const planTeamId = plan.teamId;
      const planWorkInstructionId = plan.workInstructionId;
      const relevantRisks = delayRiskJudgments.filter(
        risk => risk.teamId === planTeamId && risk.workInstructionId === planWorkInstructionId
      );

      if (relevantRisks.length > 0) {
        expect(plan.riskFactors.length).toBeGreaterThan(0);
        // リスク判定IDが完全に記録されている
        relevantRisks.forEach(risk => {
          expect(plan.riskFactors.some(f => f.includes(risk.riskJudgmentId))).toBe(true);
        });
      }
    });

    // readyForDelivery=trueの場合、すべての推奨ランキング案のriskFactorsが完全に抽出・記録されていることを確認
    if (result.readyForDelivery) {
      result.recommendedRanking.forEach((ranking) => {
        expect(ranking.riskFactors).toBeDefined();
        expect(Array.isArray(ranking.riskFactors)).toBe(true);
        expect(ranking.riskFactors.length).toBeGreaterThan(0);
      });
    }

    // 生成サマリーが存在し、適切な情報を含むことを確認
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
  });
});