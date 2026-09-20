import { saveProgressData } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-887: saveProgressData with non-existent workInstructionId', () => {
  it('should throw WorkInstructionNotFound error when workInstructionId does not exist', async () => {
    const input = {
      progressDataId: null,
      workInstructionId: 'NON_EXISTENT_WI_12345',
      facilityId: 'facility-001',
      teamId: 'team-001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 50,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    const validateReferentialIntegritySpy = jest
      .spyOn(dataPersistence as any, 'validateReferentialIntegrity')
      .mockRejectedValue(
        new (class WorkInstructionNotFound extends Error {
          name = 'WorkInstructionNotFound';
          constructor(message: string) {
            super(message);
          }
        })('指定された作業指示が見つかりません。')
      );

    await expect(saveProgressData(input)).rejects.toMatchObject({
      name: 'WorkInstructionNotFound',
      message: '指定された作業指示が見つかりません。',
    });

    expect(validateReferentialIntegritySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workInstructionId: 'NON_EXISTENT_WI_12345',
      })
    );

    validateReferentialIntegritySpy.mockRestore();
  });
});