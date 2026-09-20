import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/validation-common-calculation', () => ({
  validateReferentialIntegrity: jest.fn(),
}));

import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('作業進捗・人員配置最適化エンジン - SCEN-876', () => {
  describe('指定されたチームIDが存在しない場合にエラーを返す', () => {
    it('存在しないチームIDで検索するとReferentialIntegrityErrorをスローする', async () => {
      const mockValidateReferentialIntegrity = validateReferentialIntegrity as jest.MockedFunction<typeof validateReferentialIntegrity>;
      
      mockValidateReferentialIntegrity.mockImplementation(() => {
        const error = new Error('指定された拠点、チーム、作業指示、または作業者が見つかりません。');
        (error as any).name = 'ReferentialIntegrityError';
        throw error;
      });

      const input: ListAllocationExecutionStatusByConditionInput = {
        teamIds: ['nonexistent-team-id-001'],
        allocationExecutionStatusIds: undefined,
        allocationPlanIds: undefined,
        workInstructionIds: undefined,
        workerIds: undefined,
        facilityIds: undefined,
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
        fail('例外がスローされることを期待していましたが、スローされませんでした。');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.name).toBe('ReferentialIntegrityError');
        expect(error.message).toBe('指定された拠点、チーム、作業指示、または作業者が見つかりません。');
      }
    });
  });
});