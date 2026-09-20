import { saveProgressData, getProgressDataById } from '../../src/logic/data-persistence';
import { SaveProgressDataInput, SaveProgressDataOutput, GetProgressDataByIdInput, GetProgressDataByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-882: 新規進捗データを作成し、必須フィールドが入力された場合、進捗データIDを採番して保存し、完了率を自動計算して返す', () => {
  it('should create new progress data with auto-calculated completion rate and assigned progress data ID', async () => {
    // Arrange
    const input: SaveProgressDataInput = {
      progressDataId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 75,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: null,
      createdBy: 'USER-001',
      updatedBy: undefined
    };

    // Act
    const output: SaveProgressDataOutput = await saveProgressData(input);

    // Assert: Verify saveProgressData output
    expect(output).toBeDefined();
    expect(output.progressDataId).toBeTruthy();
    expect(output.progressDataId).toMatch(/^[A-Z0-9\-]+$/);
    expect(output.workInstructionId).toBe('WI-001');
    expect(output.facilityId).toBe('FAC-001');
    expect(output.teamId).toBe('TEAM-001');
    expect(output.progressDate).toBe('2024-01-15');
    expect(output.actualQuantity).toBe(75);
    
    // Verify completionRate is auto-calculated: (75 / 100) * 100 = 75
    expect(output.completionRate).toBe(75);
    
    expect(output.delayFlag).toBe(false);
    expect(output.isNewRecord).toBe(true);
    expect(output.savedAt).toBeTruthy();
    expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify data persistence: retrieve the same progress data by ID
    const retrieveInput: GetProgressDataByIdInput = {
      progressDataId: output.progressDataId
    };
    const retrievedData: GetProgressDataByIdOutput = await getProgressDataById(retrieveInput);

    // Assert: Verify retrieved data matches saved data
    expect(retrievedData.progressDataId).toBe(output.progressDataId);
    expect(retrievedData.workInstructionId).toBe('WI-001');
    expect(retrievedData.facilityId).toBe('FAC-001');
    expect(retrievedData.teamId).toBe('TEAM-001');
    expect(retrievedData.progressDate).toBe('2024-01-15');
    expect(retrievedData.actualQuantity).toBe(75);
    expect(retrievedData.completionRate).toBe(75);
    expect(retrievedData.delayFlag).toBe(false);
  });
});