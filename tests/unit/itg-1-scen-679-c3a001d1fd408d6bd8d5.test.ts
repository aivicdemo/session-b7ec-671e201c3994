import { saveWorkInstruction } from '../../src/logic/data-persistence';
import { SaveWorkInstructionInput } from '../../src/logic/data-persistence';

describe('SCEN-679: 予定開始日時が予定終了日時以降である場合のエラーハンドリング', () => {
  it('InvalidDateTimeRangeエラーが発生し、エラー文言が返される', async () => {
    const input: SaveWorkInstructionInput = {
      workInstructionId: null,
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionNumber: 'WI-2024-001',
      workName: '商品仕分け',
      workDescription: '商品の仕分け作業',
      plannedStartDateTime: '2024-01-15T10:00:00',
      plannedEndDateTime: '2024-01-15T09:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '高',
      createdBy: 'USER001',
      updatedBy: null,
    };

    await expect(saveWorkInstruction(input)).rejects.toThrow('InvalidDateTimeRange');
    await expect(saveWorkInstruction(input)).rejects.toThrow('予定開始日時は予定終了日時より前である必要があります。');
  });
});