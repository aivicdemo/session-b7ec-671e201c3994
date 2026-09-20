import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('listAllocationExecutionStatusByCondition', () => {
  describe('実績開始日時の範囲で絞り込んで取得する', () => {
    it('actualStartFromDateTime と actualStartToDateTime で指定された範囲に合致するデータを昇順で返す', async () => {
      const input = {
        allocationExecutionStatusIds: undefined,
        allocationPlanIds: undefined,
        workInstructionIds: undefined,
        workerIds: undefined,
        facilityIds: undefined,
        teamIds: undefined,
        allocationStates: undefined,
        delayFlagFilter: undefined,
        minProgressRate: undefined,
        maxProgressRate: undefined,
        plannedStartFromDateTime: undefined,
        plannedStartToDateTime: undefined,
        plannedEndFromDateTime: undefined,
        plannedEndToDateTime: undefined,
        actualStartFromDateTime: '2024-01-15T09:00:00Z',
        actualStartToDateTime: '2024-01-20T17:00:00Z',
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
        sortBy: 'actualStartFromDateTime',
        sortOrder: 'ASC',
        pageNumber: 1,
        pageSize: 10,
      };

      const result = await listAllocationExecutionStatusByCondition(input);

      expect(result).toBeDefined();
      expect(result.allocationExecutionStatuses).toBeDefined();
      expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

      result.allocationExecutionStatuses.forEach((status) => {
        if (status.actualStartDateTime) {
          const actualStartTime = new Date(status.actualStartDateTime).getTime();
          const rangeStart = new Date('2024-01-15T09:00:00Z').getTime();
          const rangeEnd = new Date('2024-01-20T17:00:00Z').getTime();

          expect(actualStartTime).toBeGreaterThanOrEqual(rangeStart);
          expect(actualStartTime).toBeLessThanOrEqual(rangeEnd);
        }
      });

      for (let i = 0; i < result.allocationExecutionStatuses.length - 1; i++) {
        const current = result.allocationExecutionStatuses[i].actualStartDateTime || '';
        const next = result.allocationExecutionStatuses[i + 1].actualStartDateTime || '';
        expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
      }

      expect(typeof result.totalCount).toBe('number');
      expect(result.totalCount).toBeGreaterThanOrEqual(0);

      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);

      expect(typeof result.retrievedAt).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
    });
  });
});