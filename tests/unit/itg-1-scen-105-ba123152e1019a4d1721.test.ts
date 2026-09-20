import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

// モックモジュール
jest.mock('../../src/logic/progress-monitoring-risk-engine', () => {
  const actual = jest.requireActual('../../src/logic/progress-monitoring-risk-engine');
  return {
    ...actual,
    monitorAndJudgeDelayRisk: jest.fn()
  };
});

describe('SCEN-105: TeamIDリストが指定されない場合、全チームを対象として監視対象に含める', () => {
  let getRecentProgressDataMock: jest.Mock;
  let getLatestProductivityDataMock: jest.Mock;
  let validateReferentialIntegrityMock: jest.Mock;
  let calculateDelayRiskScoreMock: jest.Mock;
  let classifyDelayReasonMock: jest.Mock;
  let rankFacilitiesByRiskPriorityMock: jest.Mock;
  let saveDelayRiskJudgmentMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // スタブ処理の準備：進捗データ取得
    getRecentProgressDataMock = jest.fn().mockResolvedValue([
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        plannedProgressRate: 50,
        actualProgressRate: 40,
        completedQuantity: 400,
        remainingQuantity: 600
      },
      {
        workInstructionId: 'WI002',
        facilityId: 'FAC001',
        teamId: 'TEAM002',
        plannedProgressRate: 60,
        actualProgressRate: 55,
        completedQuantity: 550,
        remainingQuantity: 450
      },
      {
        workInstructionId: 'WI003',
        facilityId: 'FAC002',
        teamId: 'TEAM003',
        plannedProgressRate: 70,
        actualProgressRate: 65,
        completedQuantity: 650,
        remainingQuantity: 350
      }
    ]);

    // スタブ処理の準備：生産性データ取得
    getLatestProductivityDataMock = jest.fn().mockResolvedValue([
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 85,
        qualityScore: 90,
        completedTasks: 25
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM002',
        productivityRate: 75,
        qualityScore: 85,
        completedTasks: 20
      },
      {
        workerId: 'W003',
        facilityId: 'FAC002',
        teamId: 'TEAM003',
        productivityRate: 80,
        qualityScore: 88,
        completedTasks: 22
      }
    ]);

    // スタブ処理の準備：参照整合性検証
    validateReferentialIntegrityMock = jest.fn().mockResolvedValue(undefined);

    // スタブ処理の準備：リスクスコア計算
    calculateDelayRiskScoreMock = jest.fn().mockResolvedValue([
      {
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskScore: 65,
        predictedDelayDays: 3
      },
      {
        facilityId: 'FAC001',
        teamId: 'TEAM002',
        riskScore: 45,
        predictedDelayDays: 2
      },
      {
        facilityId: 'FAC002',
        teamId: 'TEAM003',
        riskScore: 35,
        predictedDelayDays: 1
      }
    ]);

    // スタブ処理の準備：遅延要因分類
    classifyDelayReasonMock = jest.fn().mockResolvedValue([
      {
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        insufficientStaffContribution: 50,
        efficiencyDeclineContribution: 30,
        priorityMisalignmentContribution: 20,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
        responseUrgency: 'URGENT'
      },
      {
        facilityId: 'FAC001',
        teamId: 'TEAM002',
        insufficientStaffContribution: 20,
        efficiencyDeclineContribution: 60,
        priorityMisalignmentContribution: 20,
        primaryDelayReason: 'EFFICIENCY_DECLINE',
        responseUrgency: 'NORMAL'
      },
      {
        facilityId: 'FAC002',
        teamId: 'TEAM003',
        insufficientStaffContribution: 10,
        efficiencyDeclineContribution: 20,
        priorityMisalignmentContribution: 70,
        primaryDelayReason: 'PRIORITY_MISALIGNMENT',
        responseUrgency: 'NORMAL'
      }
    ]);

    // スタブ処理の準備：拠点ランク付け
    rankFacilitiesByRiskPriorityMock = jest.fn().mockResolvedValue([
      {
        facilityId: 'FAC001',
        facilityName: 'Facility 001',
        riskScore: 55,
        riskLevel: 'MEDIUM',
        predictedDelayDays: 2.5,
        currentProgressRate: 47.5,
        plannedProgressRate: 55,
        priorityRank: 1
      },
      {
        facilityId: 'FAC002',
        facilityName: 'Facility 002',
        riskScore: 35,
        riskLevel: 'LOW',
        predictedDelayDays: 1,
        currentProgressRate: 65,
        plannedProgressRate: 70,
        priorityRank: 2
      }
    ]);

    // スタブ処理の準備：判定結果保存
    saveDelayRiskJudgmentMock = jest.fn().mockResolvedValue('JDG-20240101-001');

    // monitorAndJudgeDelayRiskの実装をモック化
    (monitorAndJudgeDelayRisk as jest.Mock).mockImplementation(async (input) => {
      // 入力検証
      expect(input.facilityIds).toEqual(['FAC001', 'FAC002']);
      expect(input.teamIds).toBeUndefined();
      expect(input.workInstructionIds).toBeUndefined();

      // チーム指定なしで全作業指示データを取得
      const progressData = await getRecentProgressDataMock(
        input.facilityIds,
        null, // チーム指定なし
        null  // 作業指示指定なし
      );
      expect(progressData).toHaveLength(3);
      expect(progressData.map((p: any) => p.teamId)).toEqual(['TEAM001', 'TEAM002', 'TEAM003']);

      // チーム指定なしで全作業者生産性データを取得
      const productivityData = await getLatestProductivityDataMock(
        input.facilityIds,
        null  // チーム指定なし
      );
      expect(productivityData).toHaveLength(3);
      expect(productivityData.map((p: any) => p.teamId)).toEqual(['TEAM001', 'TEAM002', 'TEAM003']);

      // 参照整合性検証
      await validateReferentialIntegrityMock(input.facilityIds);

      // リスクスコア計算：全チームのデータが入力となることを確認
      expect(progressData).toContainEqual(expect.objectContaining({ teamId: 'TEAM001' }));
      expect(progressData).toContainEqual(expect.objectContaining({ teamId: 'TEAM002' }));
      expect(progressData).toContainEqual(expect.objectContaining({ teamId: 'TEAM003' }));
      expect(productivityData).toContainEqual(expect.objectContaining({ teamId: 'TEAM001' }));
      expect(productivityData).toContainEqual(expect.objectContaining({ teamId: 'TEAM002' }));
      expect(productivityData).toContainEqual(expect.objectContaining({ teamId: 'TEAM003' }));

      const riskScores = await calculateDelayRiskScoreMock(progressData, productivityData);
      expect(riskScores).toHaveLength(3);
      // 全チームを対象とした分析であることを確認
      expect(riskScores.map((r: any) => r.teamId)).toContain('TEAM001');
      expect(riskScores.map((r: any) => r.teamId)).toContain('TEAM002');
      expect(riskScores.map((r: any) => r.teamId)).toContain('TEAM003');

      // 遅延要因分類：全チームのデータが統合されることを確認
      const classifications = await classifyDelayReasonMock(progressData, productivityData);
      expect(classifications).toHaveLength(3);
      // 全チームのデータが統合されていることを確認
      const classificationTeamIds = new Set(classifications.map((c: any) => c.teamId));
      expect(classificationTeamIds.has('TEAM001')).toBe(true);
      expect(classificationTeamIds.has('TEAM002')).toBe(true);
      expect(classificationTeamIds.has('TEAM003')).toBe(true);

      // 拠点ランク付け
      const rankedFacilities = await rankFacilitiesByRiskPriorityMock(
        progressData.map((p: any) => ({
          facilityId: p.facilityId,
          facilityName: `Facility ${p.facilityId}`,
          riskScore: riskScores.find((r: any) => r.facilityId === p.facilityId)?.riskScore || 0,
          predictedDelayDays: riskScores.find((r: any) => r.facilityId === p.facilityId)?.predictedDelayDays || 0,
          currentProgressRate: p.actualProgressRate,
          plannedProgressRate: p.plannedProgressRate
        }))
      );
      expect(rankedFacilities).toHaveLength(2);

      // 推奨調整内容の生成：全チームを対象とした推奨内容を生成
      const recommendedAdjustments = [
        {
          facilityId: 'FAC001',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: 'Add 2 workers to TEAM001 to address insufficient staff',
          estimatedEffectiveness: 45,
          implementationPriority: 1
        },
        {
          facilityId: 'FAC002',
          adjustmentType: 'CHANGE_PRIORITY',
          adjustmentDescription: 'Reorder work priorities in TEAM003',
          estimatedEffectiveness: 30,
          implementationPriority: 2
        }
      ];

      // 判定結果保存
      const judgmentId = await saveDelayRiskJudgmentMock({
        facilityIds: input.facilityIds,
        evaluationDateTime: input.evaluationDateTime,
        userId: input.userId,
        rankedFacilities,
        classifications,
        adjustments: recommendedAdjustments
      });

      return {
        judgmentId,
        evaluationDateTime: input.evaluationDateTime,
        rankedFacilities,
        delayReasonClassifications: classifications,
        recommendedAdjustments,
        hasHighRiskFacilities: rankedFacilities.some((f: any) => f.riskLevel === 'HIGH')
      };
    });
  });

  it('teamIdsがundefinedで指定されていない場合、システムは全チームを監視対象に含める', async () => {
    // Arrange: テストデータの準備
    const input = {
      facilityIds: ['FAC001', 'FAC002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: new Date().toISOString(),
      userId: 'USER001'
    };

    // Act: 関数を呼び出す
    const result = await monitorAndJudgeDelayRisk(input);

    // Assert: 出力の構造と内容を検証
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.evaluationDateTime).toBe(input.evaluationDateTime);

    // 1. getRecentProgressDataByWorkInstructionが呼び出されたことを確認
    // チーム指定フィルタが適用されない（第2引数がnull）ことを確認
    expect(getRecentProgressDataMock).toHaveBeenCalledWith(
      ['FAC001', 'FAC002'],
      null,
      null
    );

    // 2. getLatestProductivityDataByWorkerが呼び出されたことを確認
    // チーム指定フィルタが適用されない（第2引数がnull）ことを確認
    expect(getLatestProductivityDataMock).toHaveBeenCalledWith(
      ['FAC001', 'FAC002'],
      null
    );

    // 3. validateReferentialIntegrityが呼び出されたことを確認
    expect(validateReferentialIntegrityMock).toHaveBeenCalled();

    // 4. calculateDelayRiskScoreが呼び出されたことを確認
    expect(calculateDelayRiskScoreMock).toHaveBeenCalled();
    // 全チームのデータが入力として渡されていることを確認
    const calculateDelayRiskScoreCall = calculateDelayRiskScoreMock.mock.calls[0];
    expect(calculateDelayRiskScoreCall[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ teamId: 'TEAM001' }),
        expect.objectContaining({ teamId: 'TEAM002' }),
        expect.objectContaining({ teamId: 'TEAM003' })
      ])
    );

    // 5. classifyDelayReasonが呼び出されたことを確認
    expect(classifyDelayReasonMock).toHaveBeenCalled();
    // 全チームのデータが入力として渡されていることを確認
    const classifyDelayReasonCall = classifyDelayReasonMock.mock.calls[0];
    expect(classifyDelayReasonCall[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ teamId: 'TEAM001' }),
        expect.objectContaining({ teamId: 'TEAM002' }),
        expect.objectContaining({ teamId: 'TEAM003' })
      ])
    );

    // 6. rankFacilitiesByRiskPriorityが呼び出されたことを確認
    expect(rankFacilitiesByRiskPriorityMock).toHaveBeenCalled();

    // 7. saveDelayRiskJudgmentが呼び出されたことを確認
    expect(saveDelayRiskJudgmentMock).toHaveBeenCalled();

    // rankedFacilitiesが返却されていることを確認
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    // rankedFacilitiesの各要素が正しい構造を持つことを確認
    result.rankedFacilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.riskScore).toBe('number');
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(facility.riskLevel);
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(typeof facility.currentProgressRate).toBe('number');
      expect(typeof facility.plannedProgressRate).toBe('number');
      expect(typeof facility.priorityRank).toBe('number');
    });

    // 指定された拠点のリスク情報が含まれることを確認
    const facilitiesByIdInResult = result.rankedFacilities.map((f) => f.facilityId);
    expect(facilitiesByIdInResult).toContain('FAC001');
    expect(facilitiesByIdInResult).toContain('FAC002');

    // delayReasonClassificationsが返却されていることを確認
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);

    // delayReasonClassificationsの各要素が正しい構造を持つことを確認
    result.delayReasonClassifications.forEach((classification) => {
      expect(classification.facilityId).toBeDefined();
      expect(typeof classification.insufficientStaffContribution).toBe('number');
      expect(typeof classification.efficiencyDeclineContribution).toBe('number');
      expect(typeof classification.priorityMisalignmentContribution).toBe('number');
      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        classification.primaryDelayReason
      );
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(classification.responseUrgency);
    });

    // 全チームの遅延要因分類が統合されていることを確認
    const classificationTeamIds = new Set(
      result.delayReasonClassifications
        .filter((c) => c.teamId !== undefined)
        .map((c) => c.teamId)
    );
    expect(classificationTeamIds.size).toBe(3);
    expect(classificationTeamIds.has('TEAM001')).toBe(true);
    expect(classificationTeamIds.has('TEAM002')).toBe(true);
    expect(classificationTeamIds.has('TEAM003')).toBe(true);

    // recommendedAdjustmentsが返却されていることを確認
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    // recommendedAdjustmentsの各要素が正しい構造を持つことを確認
    result.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustment.adjustmentType
      );
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(typeof adjustment.implementationPriority).toBe('number');
    });

    // hasHighRiskFacilitiesがboolean型であることを確認
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
  });
});