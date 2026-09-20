import { saveProductivityData } from '../../src/logic/data-persistence';

describe('SCEN-941: 品質スコアまたはエラー件数の計算に失敗した場合、ProductivityMetricsCalculationError エラーが発生する', () => {
  it('should throw ProductivityMetricsCalculationError when qualityScore is out of valid range', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'work-result-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.94,
      qualityScore: 1.5,
      errorCount: 0,
      proficiencyLevel: '中級',
      remarks: 'Test data',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    try {
      await saveProductivityData(input);
      fail('Should have thrown ProductivityMetricsCalculationError');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('ProductivityMetricsCalculationError');
      expect(error.message).toBe('生産性指標の計算に失敗しました。入力データを確認してください。');
    }
  });

  it('should throw ProductivityMetricsCalculationError when qualityScore is negative', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'work-result-002',
      workerId: 'worker-002',
      facilityId: 'facility-002',
      teamId: 'team-002',
      workDate: '2024-01-16',
      plannedWorkTime: 480,
      actualWorkTime: 400,
      completedItemCount: 80,
      productivityRate: 0.83,
      qualityScore: -0.5,
      errorCount: 2,
      proficiencyLevel: '初級',
      remarks: 'Test data',
      createdBy: 'user-002',
      updatedBy: undefined,
    };

    try {
      await saveProductivityData(input);
      fail('Should have thrown ProductivityMetricsCalculationError');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('ProductivityMetricsCalculationError');
      expect(error.message).toBe('生産性指標の計算に失敗しました。入力データを確認してください。');
    }
  });

  it('should throw ProductivityMetricsCalculationError when proficiencyLevel is invalid', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'work-result-003',
      workerId: 'worker-003',
      facilityId: 'facility-003',
      teamId: 'team-003',
      workDate: '2024-01-17',
      plannedWorkTime: 480,
      actualWorkTime: 420,
      completedItemCount: 95,
      productivityRate: 0.88,
      qualityScore: 0.92,
      errorCount: 1,
      proficiencyLevel: '不正なレベル',
      remarks: 'Test data',
      createdBy: 'user-003',
      updatedBy: undefined,
    };

    try {
      await saveProductivityData(input);
      fail('Should have thrown ProductivityMetricsCalculationError');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('ProductivityMetricsCalculationError');
      expect(error.message).toBe('生産性指標の計算に失敗しました。入力データを確認してください。');
    }
  });

  it('should not throw error when qualityScore is within valid range [0.0, 1.0]', async () => {
    const input = {
      productivityDataId: null,
      workResultId: 'work-result-004',
      workerId: 'worker-004',
      facilityId: 'facility-004',
      teamId: 'team-004',
      workDate: '2024-01-18',
      plannedWorkTime: 480,
      actualWorkTime: 460,
      completedItemCount: 110,
      productivityRate: 0.96,
      qualityScore: 0.95,
      errorCount: 0,
      proficiencyLevel: '上級',
      remarks: 'Test data',
      createdBy: 'user-004',
      updatedBy: undefined,
    };

    const result = await saveProductivityData(input);

    expect(result).toBeDefined();
    expect(result.productivityDataId).toBeDefined();
    expect(result.workResultId).toBe('work-result-004');
    expect(result.qualityScore).toBe(0.95);
    expect(result.errorCount).toBe(0);
    expect(result.proficiencyLevel).toBe('上級');
    expect(result.isNewRecord).toBe(true);
  });
});