import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

jest.mock('../../src/adapters/wms-handy-terminal-data-source');
jest.mock('../../src/adapters/risk-prediction-ai-adapter');

describe('SCEN-1570: 他拠点からの人員融通を提案する場合に融通元拠点の進捗が遅延リスク中以上のとき、警告ログが記録される', () => {
  let mockWmsDataSource: any;
  let mockRiskAdapter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const wmsModule = require('../../src/adapters/wms-handy-terminal-data-source');
    const riskModule = require('../../src/adapters/risk-prediction-ai-adapter');
    
    mockWmsDataSource = wmsModule.WmsHandyTerminalDataSource;
    mockRiskAdapter = riskModule.RiskPredictionAiAdapter;
  });

  it('融通元拠点の進捗がMEDIUM以上のリスクレベルのとき、警告メッセージを含む推奨調整が出力される', async () => {
    // Arrange
    const currentDateTime = new Date().toISOString();
    const userId = 'user-exec-001';

    // facility_A: 計画進捗80%、実績進捗60%、残作業量500件、配置人数5名、平均生産性50件/時間
    // facility_B: 計画進捗70%、実績進捗70%、残作業量200件、配置人数3名、平均生産性40件/時間
    mockWmsDataSource.fetchProgressData.mockResolvedValue({
      facility_A: {
        plannedProgressRate: 80,
        actualProgressRate: 60,
        remainingWorkCount: 500,
        allocatedStaffCount: 5,
      },
      facility_B: {
        plannedProgressRate: 70,
        actualProgressRate: 70,
        remainingWorkCount: 200,
        allocatedStaffCount: 3,
      },
    });

    mockWmsDataSource.fetchProductivityData.mockResolvedValue({
      facility_A: {
        averageProductivityRate: 50,
        qualityScore: 85,
      },
      facility_B: {
        averageProductivityRate: 40,
        qualityScore: 90,
      },
    });

    // リスク予測：facility_Aは高リスク、facility_Bは中リスク
    mockRiskAdapter.predictDelayRisk.mockResolvedValue({
      facility_A: {
        delayRiskPercentage: 75,
        riskLevel: 'HIGH',
        predictedDelayDays: 3,
      },
      facility_B: {
        delayRiskPercentage: 50,
        riskLevel: 'MEDIUM',
        predictedDelayDays: 1,
      },
    });

    // 人員融通の提案：facility_Bから2名をfacility_Aに融通
    mockRiskAdapter.suggestStaffingAdjustment.mockResolvedValue({
      adjustments: [
        {
          facilityId: 'facility_A',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: 'facility_Bから2名の人員融通を実施。融通元拠点の進捗にも影響する可能性があります。確認してください。',
          estimatedEffectiveness: 65,
          implementationPriority: 1,
        },
      ],
    });

    // Act
    const result = await monitorAndJudgeDelayRisk({
      facilityIds: ['facility_A', 'facility_B'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: userId,
    });

    // Assert - 1. 出力型が正常に返されることを確認
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(result.judgmentId.length).toBeGreaterThan(0);
    expect(result.evaluationDateTime).toBe(currentDateTime);

    // Assert - 2. rankedFacilitiesを確認し、facility_Bのリスクレベルが『MEDIUM』以上であることを検証
    expect(result.rankedFacilities).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThanOrEqual(2);

    const facilityBRanked = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility_B'
    );
    expect(facilityBRanked).toBeDefined();
    expect(['MEDIUM', 'HIGH'].includes(facilityBRanked!.riskLevel)).toBe(true);
    expect(facilityBRanked!.riskScore).toBeGreaterThanOrEqual(50);

    // Assert - 3. facility_Aへの推奨調整に『ADD_PERSONNEL』を含む調整が存在することを確認
    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    const staffingAdjustmentForFacilityA = result.recommendedAdjustments.find(
      (adj) =>
        adj.facilityId === 'facility_A' &&
        adj.adjustmentType === 'ADD_PERSONNEL'
    );
    expect(staffingAdjustmentForFacilityA).toBeDefined();

    // Assert - 4. 推奨調整の説明に『facility_Bから△名の人員融通をfacility_Aに実施』が含まれることを確認
    expect(staffingAdjustmentForFacilityA!.adjustmentDescription).toMatch(/facility_B/);
    expect(staffingAdjustmentForFacilityA!.adjustmentDescription).toMatch(/\d+名/);

    // Assert - 5. 警告メッセージ『融通元拠点の進捗にも影響する可能性があります。確認してください』が記録されていることを確認
    expect(staffingAdjustmentForFacilityA!.adjustmentDescription).toMatch(
      /融通元拠点の進捗にも影響する可能性があります。確認してください/
    );

    // Assert - 6. 推奨調整が有効な値であることを確認
    expect(staffingAdjustmentForFacilityA!.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
    expect(staffingAdjustmentForFacilityA!.estimatedEffectiveness).toBeLessThanOrEqual(100);
    expect(staffingAdjustmentForFacilityA!.implementationPriority).toBe(1);

    // Assert - 7. hasHighRiskFacilitiesフラグが正しく設定されていることを確認
    expect(result.hasHighRiskFacilities).toBe(true);
  });

  it('融通元拠点の進捗がLOW以下のリスクレベルのとき、警告メッセージが含まれない', async () => {
    // Arrange
    const currentDateTime = new Date().toISOString();
    const userId = 'user-exec-002';

    // facility_A: 高リスク、facility_C: 低リスク
    mockWmsDataSource.fetchProgressData.mockResolvedValue({
      facility_A: {
        plannedProgressRate: 80,
        actualProgressRate: 60,
        remainingWorkCount: 500,
        allocatedStaffCount: 5,
      },
      facility_C: {
        plannedProgressRate: 75,
        actualProgressRate: 75,
        remainingWorkCount: 100,
        allocatedStaffCount: 4,
      },
    });

    mockWmsDataSource.fetchProductivityData.mockResolvedValue({
      facility_A: {
        averageProductivityRate: 50,
        qualityScore: 85,
      },
      facility_C: {
        averageProductivityRate: 55,
        qualityScore: 95,
      },
    });

    // リスク予測：facility_Cは低リスク
    mockRiskAdapter.predictDelayRisk.mockResolvedValue({
      facility_A: {
        delayRiskPercentage: 75,
        riskLevel: 'HIGH',
        predictedDelayDays: 3,
      },
      facility_C: {
        delayRiskPercentage: 20,
        riskLevel: 'LOW',
        predictedDelayDays: 0,
      },
    });

    // 人員融通の提案：facility_Cからの融通（LOWリスク）
    mockRiskAdapter.suggestStaffingAdjustment.mockResolvedValue({
      adjustments: [
        {
          facilityId: 'facility_A',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: 'facility_Cから1名の人員融通を実施。',
          estimatedEffectiveness: 45,
          implementationPriority: 2,
        },
      ],
    });

    // Act
    const result = await monitorAndJudgeDelayRisk({
      facilityIds: ['facility_A', 'facility_C'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: userId,
    });

    // Assert - facility_Cのリスクレベルが低いことを確認
    const facilityCRanked = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility_C'
    );
    expect(facilityCRanked).toBeDefined();
    expect(facilityCRanked!.riskLevel).toBe('LOW');

    // Assert - facility_Aへの推奨調整に警告メッセージが含まれないことを確認
    const adjustmentForFacilityA = result.recommendedAdjustments.find(
      (adj) =>
        adj.facilityId === 'facility_A' &&
        adj.adjustmentType === 'ADD_PERSONNEL'
    );

    if (adjustmentForFacilityA) {
      expect(adjustmentForFacilityA.adjustmentDescription).not.toMatch(
        /融通元拠点の進捗にも影響する可能性があります/
      );
    }
  });

  it('複数拠点から融通を受ける場合、すべての融通元で警告条件をチェックし、該当する場合のみ警告メッセージを含める', async () => {
    // Arrange
    const currentDateTime = new Date().toISOString();
    const userId = 'user-exec-003';

    // facility_A: 高リスク、facility_B: 中リスク（融通元1）、facility_C: 低リスク（融通元2）
    mockWmsDataSource.fetchProgressData.mockResolvedValue({
      facility_A: {
        plannedProgressRate: 80,
        actualProgressRate: 60,
        remainingWorkCount: 500,
        allocatedStaffCount: 5,
      },
      facility_B: {
        plannedProgressRate: 70,
        actualProgressRate: 70,
        remainingWorkCount: 200,
        allocatedStaffCount: 3,
      },
      facility_C: {
        plannedProgressRate: 75,
        actualProgressRate: 75,
        remainingWorkCount: 100,
        allocatedStaffCount: 4,
      },
    });

    mockWmsDataSource.fetchProductivityData.mockResolvedValue({
      facility_A: {
        averageProductivityRate: 50,
        qualityScore: 85,
      },
      facility_B: {
        averageProductivityRate: 40,
        qualityScore: 90,
      },
      facility_C: {
        averageProductivityRate: 55,
        qualityScore: 95,
      },
    });

    // リスク予測
    mockRiskAdapter.predictDelayRisk.mockResolvedValue({
      facility_A: {
        delayRiskPercentage: 75,
        riskLevel: 'HIGH',
        predictedDelayDays: 3,
      },
      facility_B: {
        delayRiskPercentage: 50,
        riskLevel: 'MEDIUM',
        predictedDelayDays: 1,
      },
      facility_C: {
        delayRiskPercentage: 20,
        riskLevel: 'LOW',
        predictedDelayDays: 0,
      },
    });

    // 複数拠点からの融通提案
    mockRiskAdapter.suggestStaffingAdjustment.mockResolvedValue({
      adjustments: [
        {
          facilityId: 'facility_A',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: 'facility_Bから2名の人員融通を実施。融通元拠点の進捗にも影響する可能性があります。確認してください。',
          estimatedEffectiveness: 65,
          implementationPriority: 1,
        },
        {
          facilityId: 'facility_A',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: 'facility_Cから1名の人員融通を実施。',
          estimatedEffectiveness: 35,
          implementationPriority: 2,
        },
      ],
    });

    // Act
    const result = await monitorAndJudgeDelayRisk({
      facilityIds: ['facility_A', 'facility_B', 'facility_C'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: userId,
    });

    // Assert
    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(2);

    // facility_Aへの推奨調整
    const facilityAAdjustments = result.recommendedAdjustments.filter(
      (adj) => adj.facilityId === 'facility_A' && adj.adjustmentType === 'ADD_PERSONNEL'
    );

    // facility_Bのリスクレベルを確認（MEDIUM以上）
    const facilityBRanked = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility_B'
    );
    expect(facilityBRanked).toBeDefined();
    expect(['MEDIUM', 'HIGH'].includes(facilityBRanked!.riskLevel)).toBe(true);

    // facility_Bからの融通提案に警告が含まれることを確認
    const adjustmentFromB = facilityAAdjustments.find((adj) =>
      adj.adjustmentDescription.includes('facility_B')
    );
    expect(adjustmentFromB).toBeDefined();
    expect(adjustmentFromB!.adjustmentDescription).toMatch(
      /融通元拠点の進捗にも影響する可能性があります。確認してください/
    );

    // facility_Cのリスクレベルを確認（LOW）
    const facilityCRanked = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility_C'
    );
    expect(facilityCRanked).toBeDefined();
    expect(facilityCRanked!.riskLevel).toBe('LOW');

    // facility_Cからの融通提案に警告が含まれないことを確認
    const adjustmentFromC = facilityAAdjustments.find((adj) =>
      adj.adjustmentDescription.includes('facility_C')
    );
    if (adjustmentFromC) {
      expect(adjustmentFromC.adjustmentDescription).not.toMatch(
        /融通元拠点の進捗にも影響する可能性があります/
      );
    }
  });

  it('融通元拠点がMEDIUM以上のリスクレベルのとき、推奨調整に警告ログが正しく記録される', async () => {
    // Arrange
    const currentDateTime = new Date().toISOString();
    const userId = 'user-exec-004';

    mockWmsDataSource.fetchProgressData.mockResolvedValue({
      facility_A: {
        plannedProgressRate: 80,
        actualProgressRate: 60,
        remainingWorkCount: 500,
        allocatedStaffCount: 5,
      },
      facility_B: {
        plannedProgressRate: 70,
        actualProgressRate: 70,
        remainingWorkCount: 200,
        allocatedStaffCount: 3,
      },
    });

    mockWmsDataSource.fetchProductivityData.mockResolvedValue({
      facility_A: {
        averageProductivityRate: 50,
        qualityScore: 85,
      },
      facility_B: {
        averageProductivityRate: 40,
        qualityScore: 90,
      },
    });

    mockRiskAdapter.predictDelayRisk.mockResolvedValue({
      facility_A: {
        delayRiskPercentage: 75,
        riskLevel: 'HIGH',
        predictedDelayDays: 3,
      },
      facility_B: {
        delayRiskPercentage: 55,
        riskLevel: 'MEDIUM',
        predictedDelayDays: 1,
      },
    });

    mockRiskAdapter.suggestStaffingAdjustment.mockResolvedValue({
      adjustments: [
        {
          facilityId: 'facility_A',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: 'facility_Bから2名の人員融通を実施。融通元拠点の進捗にも影響する可能性があります。確認してください。',
          estimatedEffectiveness: 65,
          implementationPriority: 1,
        },
      ],
    });

    // Act
    const result = await monitorAndJudgeDelayRisk({
      facilityIds: ['facility_A', 'facility_B'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: userId,
    });

    // Assert
    expect(result.recommendedAdjustments).toBeDefined();

    const staffingAdjustments = result.recommendedAdjustments.filter(
      (adj) => adj.facilityId === 'facility_A' && adj.adjustmentType === 'ADD_PERSONNEL'
    );

    expect(staffingAdjustments.length).toBeGreaterThan(0);

    staffingAdjustments.forEach((adj) => {
      const facilityBRisk = result.rankedFacilities.find(
        (f) => f.facilityId === 'facility_B'
      );

      if (
        adj.adjustmentDescription.includes('facility_B') &&
        facilityBRisk &&
        ['MEDIUM', 'HIGH'].includes(facilityBRisk.riskLevel)
      ) {
        // 警告メッセージが含まれることを確認
        expect(adj.adjustmentDescription).toContain(
          '融通元拠点の進捗にも影響する可能性があります。確認してください'
        );

        // 推奨調整の有効性が有効な値であることを確認
        expect(adj.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
        expect(adj.estimatedEffectiveness).toBeLessThanOrEqual(100);

        // 実装優先度が有効な値であることを確認
        expect(adj.implementationPriority).toBeGreaterThanOrEqual(1);

        // 人数情報が記載されていることを確認
        expect(adj.adjustmentDescription).toMatch(/\d+名/);
      }
    });

    // エラーなく正常に判定結果が返されることを確認
    expect(result.judgmentId).toBeDefined();
    expect(result.evaluationDateTime).toBe(currentDateTime);
  });
});