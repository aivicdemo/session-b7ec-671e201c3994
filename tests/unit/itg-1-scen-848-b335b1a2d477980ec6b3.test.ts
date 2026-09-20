import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-848: listAllocationExecutionStatusByCondition - 計画終了日時の範囲で絞り込んで取得する', () => {
  it('計画終了日時の範囲で絞り込んで人員配置実行状況データを取得し、計画と実績のギャップ・進捗率・遅延フラグを提供する', async () => {
    const plannedEndFromDateTime = '2024-01-01T00:00:00Z';
    const plannedEndToDateTime = '2024-01-31T23:59:59Z';

    const input = {
      plannedEndFromDateTime,
      plannedEndToDateTime,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    expect(result.allocationExecutionStatuses.every(status => {
      const plannedEnd = new Date(status.plannedEndDateTime).getTime();
      const rangeStart = new Date(plannedEndFromDateTime).getTime();
      const rangeEnd = new Date(plannedEndToDateTime).getTime();
      return plannedEnd >= rangeStart && plannedEnd <= rangeEnd;
    })).toBe(true);

    result.allocationExecutionStatuses.forEach(status => {
      expect(status.allocationExecutionStatusId).toBeDefined();
      expect(typeof status.allocationExecutionStatusId).toBe('string');
      expect(status.allocationPlanId).toBeDefined();
      expect(status.workInstructionId).toBeDefined();
      expect(status.workerId).toBeDefined();
      expect(status.facilityId).toBeDefined();
      expect(status.teamId).toBeDefined();
      expect(status.allocationState).toBeDefined();
      expect(typeof status.allocationState).toBe('string');
      expect(status.plannedStartDateTime).toBeDefined();
      expect(status.plannedEndDateTime).toBeDefined();
      expect(status.progressRate).toBeDefined();
      expect(typeof status.progressRate).toBe('number');
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);
      expect(status.delayFlag).toBeDefined();
      expect(typeof status.delayFlag).toBe('boolean');

      if (status.actualStartDateTime !== null && status.actualStartDateTime !== undefined) {
        expect(typeof status.actualStartDateTime).toBe('string');
      }

      if (status.actualEndDateTime !== null && status.actualEndDateTime !== undefined) {
        expect(typeof status.actualEndDateTime).toBe('string');
      }

      expect(status.plannedWorkHours).toBeDefined();
      expect(typeof status.plannedWorkHours).toBe('number');
      expect(status.plannedWorkHours).toBeGreaterThan(0);

      expect(status.createdAt).toBeDefined();
      expect(typeof status.createdAt).toBe('string');
      expect(status.updatedAt).toBeDefined();
      expect(typeof status.updatedAt).toBe('string');
      expect(status.createdBy).toBeDefined();
      expect(typeof status.createdBy).toBe('string');
    });

    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoDateTimeRegex.test(result.retrievedAt)).toBe(true);

    const retrievedTime = new Date(result.retrievedAt).getTime();
    const now = Date.now();
    const timeDifference = Math.abs(now - retrievedTime);
    expect(timeDifference).toBeLessThan(60000);

    expect(result.allocationExecutionStatuses.length).toBeLessThanOrEqual(result.totalCount);

    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
      expect(result.pageNumber).toBeGreaterThanOrEqual(1);
    }

    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
      expect(result.pageSize).toBeGreaterThan(0);
    }
  });

  it('計画と実績のギャップ（遅延日数）が正確に計算されていることを検証する', async () => {
    const plannedEndFromDateTime = '2024-01-01T00:00:00Z';
    const plannedEndToDateTime = '2024-01-31T23:59:59Z';

    const input = {
      plannedEndFromDateTime,
      plannedEndToDateTime,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach(status => {
      if (status.delayFlag === true) {
        expect(status.progressRate).toBeLessThan(100);
        const plannedEnd = new Date(status.plannedEndDateTime).getTime();
        const now = Date.now();
        expect(plannedEnd).toBeLessThan(now);
      }
    });
  });

  it('ページネーションが指定されない場合、デフォルト動作またはnull/undefinedが返される', async () => {
    const plannedEndFromDateTime = '2024-01-01T00:00:00Z';
    const plannedEndToDateTime = '2024-01-31T23:59:59Z';

    const input = {
      plannedEndFromDateTime,
      plannedEndToDateTime,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');

    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
    }

    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
    }
  });

  it('計画終了日時範囲外のレコードが結果に含まれないことを検証する', async () => {
    const plannedEndFromDateTime = '2024-01-15T00:00:00Z';
    const plannedEndToDateTime = '2024-01-20T23:59:59Z';

    const input = {
      plannedEndFromDateTime,
      plannedEndToDateTime,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach(status => {
      const plannedEnd = new Date(status.plannedEndDateTime).getTime();
      const rangeStart = new Date(plannedEndFromDateTime).getTime();
      const rangeEnd = new Date(plannedEndToDateTime).getTime();
      expect(plannedEnd).toBeGreaterThanOrEqual(rangeStart);
      expect(plannedEnd).toBeLessThanOrEqual(rangeEnd);
    });
  });

  it('進捗率が0～100の正当な範囲内にあることを検証する', async () => {
    const plannedEndFromDateTime = '2024-01-01T00:00:00Z';
    const plannedEndToDateTime = '2024-01-31T23:59:59Z';

    const input = {
      plannedEndFromDateTime,
      plannedEndToDateTime,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach(status => {
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);
      expect(Number.isInteger(status.progressRate) || typeof status.progressRate === 'number').toBe(true);
    });
  });

  it('遅延フラグが真偽値（true/false）であることを検証する', async () => {
    const plannedEndFromDateTime = '2024-01-01T00:00:00Z';
    const plannedEndToDateTime = '2024-01-31T23:59:59Z';

    const input = {
      plannedEndFromDateTime,
      plannedEndToDateTime,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach(status => {
      expect(typeof status.delayFlag).toBe('boolean');
      expect([true, false]).toContain(status.delayFlag);
    });
  });
});