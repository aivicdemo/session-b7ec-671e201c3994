import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-870: 出力にデータ取得日時がISO8601形式で含まれる', () => {
  it('should return retrievedAt in ISO8601 format when calling listAllocationExecutionStatusByCondition', async () => {
    // テスト前提条件: 現在日時を固定値として設定
    const fixedNow = new Date('2024-01-15T14:30:45.123Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    try {
      // 入力値を準備
      const input = {
        allocationPlanIds: ['plan-001'],
        pageNumber: 1,
        pageSize: 10,
      };

      // listAllocationExecutionStatusByConditionを呼び出し
      const result = await listAllocationExecutionStatusByCondition(input);

      // 出力のretrievedAtを検証
      expect(result).toBeDefined();
      expect(result.retrievedAt).toBeDefined();

      // ISO8601形式の正規表現チェック
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(result.retrievedAt).toMatch(iso8601Regex);

      // 固定した現在日時と一致することを確認
      expect(new Date(result.retrievedAt).getTime()).toBe(fixedNow.getTime());

      // タイムゾーン指定子「Z」（UTC）を含むことを確認
      expect(result.retrievedAt).toMatch(/Z$/);

      // その他の必須フィールドが存在することを確認
      expect(result.allocationExecutionStatuses).toBeDefined();
      expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe('number');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should include allocationExecutionStatuses array in the output', async () => {
    const fixedNow = new Date('2024-01-15T14:30:45.123Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    try {
      const input = {
        allocationPlanIds: ['plan-001'],
        pageNumber: 1,
        pageSize: 10,
      };

      const result = await listAllocationExecutionStatusByCondition(input);

      expect(result).toBeDefined();
      expect(result.allocationExecutionStatuses).toBeDefined();
      expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should include totalCount as a number in the output', async () => {
    const fixedNow = new Date('2024-01-15T14:30:45.123Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    try {
      const input = {
        allocationPlanIds: ['plan-001'],
        pageNumber: 1,
        pageSize: 10,
      };

      const result = await listAllocationExecutionStatusByCondition(input);

      expect(result).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe('number');
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    } finally {
      jest.useRealTimers();
    }
  });
});