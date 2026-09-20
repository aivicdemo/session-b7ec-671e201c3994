import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - 人員配置実行状況の取得', () => {
  describe('SCEN-878: 指定された作業者IDが存在しない場合にエラーを返す', () => {
    it('存在しないworkerIdを指定した場合、ReferentialIntegrityErrorを返す', async () => {
      const input = {
        workerIds: ['WORKER-999999'],
        facilityIds: undefined,
        teamIds: undefined,
        allocationPlanIds: undefined,
        workInstructionIds: undefined,
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
          message: '指定された拠点、チーム、作業指示、または作業者が見つかりません。',
        })
      );
    });
  });
});