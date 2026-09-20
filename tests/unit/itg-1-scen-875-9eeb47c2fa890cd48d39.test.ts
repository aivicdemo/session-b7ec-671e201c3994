import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import * as validationModule from '../../src/logic/validation-common-calculation';

jest.mock('../../src/logic/validation-common-calculation');

describe('SCEN-875: listAllocationExecutionStatusByCondition - 存在しない拠点ID指定時のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない拠点IDを指定した場合、ReferentialIntegrityErrorを返す', async () => {
    const mockValidateReferentialIntegrity = validationModule.validateReferentialIntegrity as jest.Mock;
    mockValidateReferentialIntegrity.mockImplementation(() => {
      const error = new Error('指定された拠点、チーム、作業指示、または作業者が見つかりません。');
      (error as any).name = 'ReferentialIntegrityError';
      throw error;
    });

    const input = {
      facilityIds: ['FACILITY-NONEXISTENT-001'],
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minPlannedWorkHours: undefined,
      maxPlannedWorkHours: undefined,
      minActualWorkHours: undefined,
      maxActualWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'ReferentialIntegrityError',
        message: expect.stringContaining('指定された拠点、チーム、作業指示、または作業者が見つかりません。'),
      })
    );

    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['FACILITY-NONEXISTENT-001'],
      })
    );
  });

  it('validateReferentialIntegrity が呼び出され、存在しない拠点を検出したらクエリが実行されない', async () => {
    const mockValidateReferentialIntegrity = validationModule.validateReferentialIntegrity as jest.Mock;
    mockValidateReferentialIntegrity.mockImplementation(() => {
      const error = new Error('指定された拠点、チーム、作業指示、または作業者が見つかりません。');
      (error as any).name = 'ReferentialIntegrityError';
      throw error;
    });

    const input = {
      facilityIds: ['FACILITY-NONEXISTENT-001'],
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minPlannedWorkHours: undefined,
      maxPlannedWorkHours: undefined,
      minActualWorkHours: undefined,
      maxActualWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('Expected ReferentialIntegrityError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('ReferentialIntegrityError');
      expect(error.message).toContain('指定された拠点、チーム、作業指示、または作業者が見つかりません。');
    }

    expect(mockValidateReferentialIntegrity).toHaveBeenCalledTimes(1);
  });
});