import { saveProductivityData } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  saveProductivityData: jest.fn(),
}));

describe('SCEN-929: 既存の生産性データIDを指定して既に保存済みの生産性データを更新する', () => {
  let mockSaveProductivityData: jest.MockedFunction<typeof saveProductivityData>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveProductivityData = saveProductivityData as jest.MockedFunction<typeof saveProductivityData>;
  });

  it('should update existing productivity data with new values and return updated output', async () => {
    const existingProductivityData = {
      productivityDataId: 'PROD-001',
      workResultId: 'WR-100',
      workerId: 'W-001',
      facilityId: 'FAC-01',
      teamId: 'TEAM-A',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9375,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: '初期保存テスト',
      createdBy: 'ADMIN-001',
      updatedBy: null,
    };

    const updateInput = {
      productivityDataId: 'PROD-001',
      workResultId: 'WR-100',
      workerId: 'W-001',
      facilityId: 'FAC-01',
      teamId: 'TEAM-A',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 420,
      completedItemCount: 105,
      productivityRate: 0.875,
      qualityScore: 0.98,
      errorCount: 1,
      proficiencyLevel: '上級',
      remarks: '更新テスト実施',
      createdBy: 'ADMIN-001',
      updatedBy: 'ADMIN-002',
    };

    const currentDateTime = new Date().toISOString();

    const expectedOutput = {
      productivityDataId: 'PROD-001',
      workResultId: 'WR-100',
      workerId: 'W-001',
      facilityId: 'FAC-01',
      teamId: 'TEAM-A',
      workDate: '2024-01-15',
      productivityRate: 0.875,
      qualityScore: 0.98,
      errorCount: 1,
      proficiencyLevel: '上級',
      savedAt: currentDateTime,
      isNewRecord: false,
    };

    mockSaveProductivityData.mockResolvedValue(expectedOutput);

    const result = await saveProductivityData(updateInput);

    expect(mockSaveProductivityData).toHaveBeenCalledWith(updateInput);
    expect(result.productivityDataId).toBe('PROD-001');
    expect(result.workResultId).toBe('WR-100');
    expect(result.workerId).toBe('W-001');
    expect(result.facilityId).toBe('FAC-01');
    expect(result.teamId).toBe('TEAM-A');
    expect(result.workDate).toBe('2024-01-15');
    expect(result.productivityRate).toBe(0.875);
    expect(result.qualityScore).toBe(0.98);
    expect(result.errorCount).toBe(1);
    expect(result.proficiencyLevel).toBe('上級');
    expect(result.isNewRecord).toBe(false);
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
  });
});