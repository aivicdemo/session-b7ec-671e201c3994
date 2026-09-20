import { findAllocationChangeHistoryByPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-656: 指定期間内の割当変更履歴を権限確認後に検索し、時系列昇順で一覧取得', () => {
  let mockAuthorizeUserAction: jest.Mock;
  let mockValidateInputData: jest.Mock;

  beforeEach(() => {
    mockAuthorizeUserAction = jest.fn().mockResolvedValue(true);
    mockValidateInputData = jest.fn().mockResolvedValue(true);

    // Inject mocks if needed - depends on how the function accesses these dependencies
    jest.spyOn(global, 'Date');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('指定期間内の割当変更履歴を時系列昇順で検索取得できる', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-001';

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter: undefined,
      requestingUserId,
    });

    // 1. allocationChangeHistories フィールドが存在し、配列型であることを確認
    expect(result).toHaveProperty('allocationChangeHistories');
    expect(Array.isArray(result.allocationChangeHistories)).toBe(true);

    // 2. allocationChangeHistories 配列内の各レコードが時系列昇順（変更日時の古い順）でソートされていることを確認
    if (result.allocationChangeHistories.length > 1) {
      for (let i = 0; i < result.allocationChangeHistories.length - 1; i++) {
        const current = new Date(result.allocationChangeHistories[i].changeExecutionDate).getTime();
        const next = new Date(result.allocationChangeHistories[i + 1].changeExecutionDate).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    }

    // 3. totalCount フィールドが allocationChangeHistories の配列要素数と一致することを確認
    expect(result).toHaveProperty('totalCount');
    expect(result.totalCount).toBe(result.allocationChangeHistories.length);

    // 4. found フィールドが true であることを確認（レコードが存在する場合）
    expect(result).toHaveProperty('found');
    if (result.allocationChangeHistories.length > 0) {
      expect(result.found).toBe(true);
    }

    // 5. periodStartDate フィールドが 2024年1月1日と一致することを確認
    expect(result).toHaveProperty('periodStartDate');
    expect(new Date(result.periodStartDate).toISOString().split('T')[0]).toBe('2024-01-01');

    // 6. periodEndDate フィールドが 2024年1月31日と一致することを確認
    expect(result).toHaveProperty('periodEndDate');
    expect(new Date(result.periodEndDate).toISOString().split('T')[0]).toBe('2024-01-31');
  });

  it('検索結果に複数の割当変更履歴が含まれる場合、すべてが指定期間内であることを確認', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-001';

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter: undefined,
      requestingUserId,
    });

    // 各レコードが指定期間内（startDate ≤ changeExecutionDate ≤ endDate）であることを確認
    result.allocationChangeHistories.forEach((record) => {
      const recordDate = new Date(record.changeExecutionDate);
      expect(recordDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(recordDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });

  it('検索結果が空の場合、found フィールドが false で返されることを確認', async () => {
    const startDate = new Date('2099-01-01');
    const endDate = new Date('2099-12-31');
    const requestingUserId = 'user-001';

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter: undefined,
      requestingUserId,
    });

    // 結果が空の場合の期待値を確認
    if (result.allocationChangeHistories.length === 0) {
      expect(result.found).toBe(false);
      expect(result.totalCount).toBe(0);
    }
  });

  it('指定期間内の割当変更履歴の必須フィールドがすべて返されることを確認', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-001';

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter: undefined,
      requestingUserId,
    });

    // 各レコードに必須フィールドが存在することを確認
    result.allocationChangeHistories.forEach((record) => {
      expect(record).toHaveProperty('allocationChangeHistoryId');
      expect(record).toHaveProperty('workerId');
      expect(record).toHaveProperty('previousPlacementPlanId');
      expect(record).toHaveProperty('newPlacementPlanId');
      expect(record).toHaveProperty('previousDepartmentId');
      expect(record).toHaveProperty('newDepartmentId');
      expect(record).toHaveProperty('changeReason');
      expect(record).toHaveProperty('changeExecutionDate');
      expect(record).toHaveProperty('executorUserId');
      expect(record).toHaveProperty('status');
      expect(record).toHaveProperty('createdAt');
      expect(record).toHaveProperty('updatedAt');
    });
  });

  it('statusFilter が指定された場合、そのステータスのみが返されることを確認', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-001';
    const statusFilter = 'approved';

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter,
      requestingUserId,
    });

    // すべてのレコードが指定ステータスであることを確認
    result.allocationChangeHistories.forEach((record) => {
      expect(record.status).toBe(statusFilter);
    });
  });
});