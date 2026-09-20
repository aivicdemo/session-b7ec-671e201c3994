import { saveProgressData } from '../../src/logic/data-persistence';

describe('saveProgressData - TeamNotFound Error', () => {
  it('should throw TeamNotFound error when teamId does not exist', async () => {
    const input = {
      progressDataId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-NONEXISTENT',
      progressDate: '2025-01-15',
      plannedQuantity: 100,
      actualQuantity: 50,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER-001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'TeamNotFound',
        message: expect.stringContaining('指定されたチームが見つかりません。'),
      })
    );
  });
});