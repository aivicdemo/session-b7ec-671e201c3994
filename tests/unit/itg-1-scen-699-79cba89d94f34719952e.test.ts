import { saveWorkResult } from '../../src/logic/data-persistence';

describe('SCEN-699: 新規作成時に全ての必須フィールドが正常な値で入力されると、作業実績が新規登録されて保存日時とisNewRecord=trueを返す', () => {
  it('should create a new work result with all required fields and return isNewRecord=true', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TM-001',
      actualStartDateTime: '2024-01-15T08:00:00Z',
      actualEndDateTime: '2024-01-15T12:00:00Z',
      actualQuantity: 100,
      workStatus: '完了',
      defectCount: 5,
      remarks: '特に支障なし',
      createdBy: 'USR-001',
      updatedBy: undefined,
    };

    const result = await saveWorkResult(input);

    expect(result).toBeDefined();
    expect(result.workResultId).toBeDefined();
    expect(typeof result.workResultId).toBe('string');
    expect(result.workResultId).not.toBeNull();
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('WKR-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TM-001');
    expect(result.actualQuantity).toBe(100);
    expect(result.workStatus).toBe('完了');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.isNewRecord).toBe(true);
  });
});