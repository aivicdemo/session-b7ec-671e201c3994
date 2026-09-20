import { saveProgressData } from '../../src/logic/data-persistence';

describe('SCEN-886: 進捗データの必須フィールド検証', () => {
  it('workInstructionIdがnullの場合、InvalidProgressDataInputエラーが発生する', async () => {
    const input = {
      progressDataId: undefined,
      workInstructionId: null,
      facilityId: 'F001',
      teamId: 'T001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDataInputError',
        message: expect.stringContaining(
          '進捗データの入力値が不正です。必須フィールドと形式を確認してください。'
        ),
      })
    );
  });

  it('facilityIdがnullの場合、InvalidProgressDataInputエラーが発生する', async () => {
    const input = {
      progressDataId: undefined,
      workInstructionId: 'WI001',
      facilityId: null,
      teamId: 'T001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDataInputError',
        message: expect.stringContaining(
          '進捗データの入力値が不正です。必須フィールドと形式を確認してください。'
        ),
      })
    );
  });

  it('teamIdがundefinedの場合、InvalidProgressDataInputエラーが発生する', async () => {
    const input = {
      progressDataId: undefined,
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: undefined,
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDataInputError',
        message: expect.stringContaining(
          '進捗データの入力値が不正です。必須フィールドと形式を確認してください。'
        ),
      })
    );
  });

  it('progressDateがnullの場合、InvalidProgressDataInputエラーが発生する', async () => {
    const input = {
      progressDataId: undefined,
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      progressDate: null,
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDataInputError',
        message: expect.stringContaining(
          '進捗データの入力値が不正です。必須フィールドと形式を確認してください。'
        ),
      })
    );
  });

  it('plannedQuantityがundefinedの場合、InvalidProgressDataInputエラーが発生する', async () => {
    const input = {
      progressDataId: undefined,
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      progressDate: '2024-01-15',
      plannedQuantity: undefined,
      actualQuantity: 80,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDataInputError',
        message: expect.stringContaining(
          '進捗データの入力値が不正です。必須フィールドと形式を確認してください。'
        ),
      })
    );
  });

  it('actualQuantityがnullの場合、InvalidProgressDataInputエラーが発生する', async () => {
    const input = {
      progressDataId: undefined,
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: null,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDataInputError',
        message: expect.stringContaining(
          '進捗データの入力値が不正です。必須フィールドと形式を確認してください。'
        ),
      })
    );
  });

  it('createdByがundefinedの場合、InvalidProgressDataInputエラーが発生する', async () => {
    const input = {
      progressDataId: undefined,
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: undefined,
      updatedBy: undefined,
    };

    await expect(saveProgressData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressDataInputError',
        message: expect.stringContaining(
          '進捗データの入力値が不正です。必須フィールドと形式を確認してください。'
        ),
      })
    );
  });
});