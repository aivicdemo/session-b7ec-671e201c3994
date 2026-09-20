import { saveWorkInstruction } from '../../src/logic/data-persistence';

describe('SCEN-675: SaveWorkInstruction - isNewRecord flag differs between create and update', () => {
  it('should return isNewRecord=true for new record creation and isNewRecord=false for update', async () => {
    // Test case 1: New record creation
    const createInput = {
      workInstructionId: null,
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionNumber: 'WI-20240101-001',
      workName: '商品仕分け',
      workDescription: null,
      plannedStartDateTime: '2024-01-01T08:00:00',
      plannedEndDateTime: '2024-01-01T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '高',
      createdBy: 'USER001',
      updatedBy: null,
    };

    const createResult = await saveWorkInstruction(createInput);

    // Verify creation result
    expect(createResult).toBeDefined();
    expect(createResult.workInstructionId).not.toBeNull();
    expect(createResult.workInstructionId).toBeTruthy();
    expect(createResult.workInstructionNumber).toBe('WI-20240101-001');
    expect(createResult.facilityId).toBe('FAC001');
    expect(createResult.teamId).toBe('TEAM001');
    expect(createResult.workName).toBe('商品仕分け');
    expect(createResult.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(createResult.isNewRecord).toBe(true);

    // Test case 2: Update existing record
    const updateInput = {
      workInstructionId: createResult.workInstructionId,
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionNumber: 'WI-20240101-001',
      workName: '商品仕分け',
      workDescription: '詳細な作業手順を追加',
      plannedStartDateTime: '2024-01-01T09:00:00',
      plannedEndDateTime: '2024-01-01T18:00:00',
      progressStatus: '進行中',
      progressRate: 50,
      requiredWorkerCount: 5,
      priority: '中',
      createdBy: 'USER001',
      updatedBy: 'USER002',
    };

    const updateResult = await saveWorkInstruction(updateInput);

    // Verify update result
    expect(updateResult).toBeDefined();
    expect(updateResult.workInstructionId).toBe(createResult.workInstructionId);
    expect(updateResult.workInstructionNumber).toBe('WI-20240101-001');
    expect(updateResult.facilityId).toBe('FAC001');
    expect(updateResult.teamId).toBe('TEAM001');
    expect(updateResult.workName).toBe('商品仕分け');
    expect(updateResult.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(updateResult.isNewRecord).toBe(false);

    // Verify the difference in isNewRecord flag
    expect(createResult.isNewRecord).not.toBe(updateResult.isNewRecord);
    expect(createResult.isNewRecord).toBe(true);
    expect(updateResult.isNewRecord).toBe(false);
  });
});