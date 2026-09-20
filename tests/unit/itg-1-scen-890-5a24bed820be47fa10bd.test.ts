import { saveProgressData, SaveProgressDataInput, SaveProgressDataOutput } from '../../src/logic/data-persistence';

describe('SCEN-890: 実績数量が負数である場合、InvalidQuantityRangeエラーが発生する', () => {
  it('should throw InvalidQuantityRange error when actualQuantity is negative', async () => {
    const input: SaveProgressDataInput = {
      progressDataId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: -5,
      completionRate: undefined,
      delayFlag: false,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER-001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toMatchObject({
      name: 'InvalidQuantityRange',
      message: '実績数量が計画数量の範囲を超えています。',
    });
  });
});