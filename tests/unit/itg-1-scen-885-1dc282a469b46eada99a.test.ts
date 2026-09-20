import { saveProgressData } from '../../src/logic/data-persistence';

describe('SCEN-885: 遅延フラグが省略または false の場合、遅延日数は null として扱われる', () => {
  it('should handle undefined delayFlag and delayDays, setting delayFlag to false and delayDays to null or undefined', async () => {
    const input = {
      progressDataId: null,
      workInstructionId: 'WI-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    const result = await saveProgressData(input);

    expect(result.delayFlag).toBe(false);
    // delayDaysはフィールドが含まれない、またはnullのいずれかを許容
    if (result.hasOwnProperty('delayDays')) {
      expect(result.delayDays).toBeNull();
    }
    expect(result.progressDataId).toBeDefined();
    expect(result.progressDataId).not.toBeNull();
    expect(result.isNewRecord).toBe(true);
    expect(result.completionRate).toBe(80);
    expect(result.actualQuantity).toBe(80);
    expect(result.progressDate).toBe('2024-01-15');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.facilityId).toBe('F-001');
    expect(result.teamId).toBe('T-001');
  });
});