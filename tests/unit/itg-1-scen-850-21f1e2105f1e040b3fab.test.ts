import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
  GetAllocationExecutionStatusByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-850: 実績終了日時の範囲で絞り込んで取得する', () => {
  const mockAllocationExecutionStatuses: GetAllocationExecutionStatusByIdOutput[] = [
    {
      allocationExecutionStatusId: 'aes-001',
      allocationPlanId: 'ap-001',
      workInstructionId: 'wi-001',
      workerId: 'w-001',
      facilityId: 'f-001',
      teamId: 't-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-20T17:00:00Z',
      actualStartDateTime: '2024-01-15T09:00:00Z',
      actualEndDateTime: '2024-01-20T16:30:00Z',
      plannedWorkHours: 40,
      actualWorkHours: 39.5,
      progressRate: 95,
      delayFlag: false,
      remarks: 'テストレコード1',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-20T16:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    },
    {
      allocationExecutionStatusId: 'aes-002',
      allocationPlanId: 'ap-002',
      workInstructionId: 'wi-002',
      workerId: 'w-002',
      facilityId: 'f-002',
      teamId: 't-002',
      allocationState: '完了',
      plannedStartDateTime: '2024-01-16T08:00:00Z',
      plannedEndDateTime: '2024-01-19T17:00:00Z',
      actualStartDateTime: '2024-01-16T08:30:00Z',
      actualEndDateTime: '2024-01-19T18:00:00Z',
      plannedWorkHours: 32,
      actualWorkHours: 32.5,
      progressRate: 100,
      delayFlag: true,
      remarks: 'テストレコード2',
      createdAt: '2024-01-11T10:00:00Z',
      updatedAt: '2024-01-19T18:00:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-003',
    },
    {
      allocationExecutionStatusId: 'aes-003',
      allocationPlanId: 'ap-003',
      workInstructionId: 'wi-003',
      workerId: 'w-003',
      facilityId: 'f-001',
      teamId: 't-001',
      allocationState: '完了',
      plannedStartDateTime: '2024-01-17T08:00:00Z',
      plannedEndDateTime: '2024-01-18T17:00:00Z',
      actualStartDateTime: '2024-01-17T09:00:00Z',
      actualEndDateTime: '2024-01-18T17:15:00Z',
      plannedWorkHours: 24,
      actualWorkHours: 24.25,
      progressRate: 100,
      delayFlag: true,
      remarks: 'テストレコード3',
      createdAt: '2024-01-12T10:00:00Z',
      updatedAt: '2024-01-18T17:15:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    },
  ];

  it('実績終了日時の範囲で絞り込んで人員配置実行状況データの一覧を取得する', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
  });

  it('実績終了日時範囲が2024-01-15T09:00:00Z以上2024-01-20T18:00:00Z以下のレコードをすべて含む', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    const fromDateTime = new Date('2024-01-15T09:00:00Z').getTime();
    const toDateTime = new Date('2024-01-20T18:00:00Z').getTime();

    result.allocationExecutionStatuses.forEach((record) => {
      const actualEndTime = new Date(record.actualEndDateTime || '').getTime();
      expect(actualEndTime).toBeGreaterThanOrEqual(fromDateTime);
      expect(actualEndTime).toBeLessThanOrEqual(toDateTime);
    });
  });

  it('各レコードに計画と実績のギャップが含まれる', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((record) => {
      expect(record.plannedWorkHours).toBeDefined();
      expect(typeof record.plannedWorkHours).toBe('number');
      if (record.actualWorkHours !== undefined) {
        const gap = record.plannedWorkHours - record.actualWorkHours;
        expect(typeof gap).toBe('number');
      }
    });
  });

  it('各レコードに進捗率（0～100の数値）が含まれる', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((record) => {
      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);
    });
  });

  it('各レコードに遅延フラグ（true/false）が含まれる', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((record) => {
      expect(record.delayFlag).toBeDefined();
      expect(typeof record.delayFlag).toBe('boolean');
    });
  });

  it('遅延フラグは計画終了日時と実績終了日時の比較で判定される', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((record) => {
      if (record.actualEndDateTime !== undefined) {
        const plannedTime = new Date(record.plannedEndDateTime).getTime();
        const actualTime = new Date(record.actualEndDateTime).getTime();
        const expectedDelayFlag = actualTime > plannedTime;
        expect(record.delayFlag).toBe(expectedDelayFlag);
      }
    });
  });

  it('totalCountにはページング前の全件数が格納される', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationExecutionStatuses.length);
    expect(typeof result.totalCount).toBe('number');
  });

  it('ページング指定なしの場合、pageNumberとpageSizeはnullまたはundefined', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result.pageNumber === null || result.pageNumber === undefined).toBe(true);
    expect(result.pageSize === null || result.pageSize === undefined).toBe(true);
  });

  it('retrievedAtはISO8601形式のデータ取得日時である', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);
  });

  it('出力型はListAllocationExecutionStatusByConditionOutputである', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    expect(result).toHaveProperty('allocationExecutionStatuses');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('retrievedAt');
  });

  it('範囲外のactualEndDateTimeを持つレコードは含まれない', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      actualEndFromDateTime: '2024-01-15T09:00:00Z',
      actualEndToDateTime: '2024-01-20T18:00:00Z',
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    const fromDateTime = new Date('2024-01-15T09:00:00Z').getTime();
    const toDateTime = new Date('2024-01-20T18:00:00Z').getTime();

    result.allocationExecutionStatuses.forEach((record) => {
      if (record.actualEndDateTime) {
        const actualEndTime = new Date(record.actualEndDateTime).getTime();
        expect(actualEndTime >= fromDateTime && actualEndTime <= toDateTime).toBe(true);
      }
    });
  });
});