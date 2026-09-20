import { jest } from '@jest/globals';
import {
  saveAllocationChangeHistory,
  findPlacementPlanByWorkerAndDate,
  findDepartmentById,
  findUserById,
} from '../../src/logic/persistence-layer';
import type {
  SaveAllocationChangeHistoryInput,
  SaveAllocationChangeHistoryOutput,
  FindPlacementPlanByWorkerAndDateOutput,
  FindDepartmentByIdOutput,
  FindUserByIdOutput,
} from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-649: 割当変更履歴の複数ステータス値保存テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockPlacementPlanOutput = (
    id: string,
  ): FindPlacementPlanByWorkerAndDateOutput => ({
    placementPlanId: id,
    workerId: 'WKR-100',
    placementDepartment: id === 'PPL-001' ? 'DEPT-A' : 'DEPT-B',
    placementJobType: id === 'PPL-001' ? 'WTP-01' : 'WTP-02',
    startDate: new Date('2025-01-01T00:00:00Z'),
    endDate: new Date('2025-12-31T23:59:59Z'),
    placementStatus: 'active',
    expectedProductivityTarget: 100,
    optimizationReason: 'テスト用',
    found: true,
  });

  const createMockDepartmentOutput = (
    id: string,
  ): FindDepartmentByIdOutput => ({
    departmentId: id,
    departmentName: id === 'DEPT-A' ? 'Department A' : 'Department B',
    departmentCode: id === 'DEPT-A' ? 'DEPT-A-CODE' : 'DEPT-B-CODE',
    description: 'Test department',
    parentDepartmentId: null,
    responsibleUserId: 'USR-RESP-001',
    status: 'active',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    found: true,
  });

  const createMockUserOutput = (userId: string): FindUserByIdOutput => ({
    userId,
    userName: `user-${userId}`,
    email: `${userId}@example.com`,
    fullName: `User ${userId}`,
    role: 'admin',
    siteId: null,
    teamId: null,
    status: 'active',
    lastLoginDateTime: null,
    found: true,
  });

  const createMockOutput = (
    input: SaveAllocationChangeHistoryInput,
  ): SaveAllocationChangeHistoryOutput => ({
    success: true,
    allocationChangeHistoryId: input.allocationChangeHistoryId,
    workerId: input.workerId,
    previousPlacementPlanId: input.previousPlacementPlanId,
    newPlacementPlanId: input.newPlacementPlanId,
    changeExecutionDate: input.changeExecutionDate,
    status: input.status,
    savedAt: new Date(),
  });

  const baseInput: SaveAllocationChangeHistoryInput = {
    allocationChangeHistoryId: 'AACH-001',
    workerId: 'WKR-100',
    previousPlacementPlanId: 'PPL-001',
    newPlacementPlanId: 'PPL-002',
    previousDepartmentId: 'DEPT-A',
    newDepartmentId: 'DEPT-B',
    previousWorkTypeId: 'WTP-01',
    newWorkTypeId: 'WTP-02',
    changeReason: '生産性向上',
    changeReasonDetail: 'ラインA から高速ラインB への配置',
    changeExecutionDate: new Date('2025-01-15T09:00:00Z'),
    plannedChangeDate: new Date('2025-01-15T08:00:00Z'),
    executorUserId: 'USR-EXEC-001',
    approverUserId: 'USR-APP-001',
    approvalDateTime: new Date('2025-01-14T17:30:00Z'),
    status: 'pending',
    createdBy: 'USR-CREATOR-001',
    requestingUserId: 'USR-REQ-001',
  };

  const statusValues: Array<'pending' | 'approved' | 'executed' | 'cancelled'> =
    ['pending', 'approved', 'executed', 'cancelled'];

  const setupMocks = () => {
    (findPlacementPlanByWorkerAndDate as jest.Mock).mockImplementation(
      (input) => {
        if (input.placementPlanId === 'PPL-001' || input.placementPlanId === 'PPL-002') {
          return Promise.resolve(createMockPlacementPlanOutput(input.placementPlanId));
        }
        return Promise.resolve({ found: false });
      },
    );

    (findDepartmentById as jest.Mock).mockImplementation((input) => {
      if (input.departmentId === 'DEPT-A' || input.departmentId === 'DEPT-B') {
        return Promise.resolve(createMockDepartmentOutput(input.departmentId));
      }
      return Promise.resolve({ found: false });
    });

    (findUserById as jest.Mock).mockImplementation((input) => {
      if (
        input.userId === 'USR-EXEC-001' ||
        input.userId === 'USR-APP-001' ||
        input.userId === 'USR-CREATOR-001'
      ) {
        return Promise.resolve(createMockUserOutput(input.userId));
      }
      return Promise.resolve({ found: false });
    });
  };

  statusValues.forEach((status) => {
    describe(`status='${status}' での保存テスト`, () => {
      it(`指定されたステータス値 '${status}' が出力結果に反映される`, async () => {
        setupMocks();

        const input: SaveAllocationChangeHistoryInput = {
          ...baseInput,
          status,
        };

        (saveAllocationChangeHistory as jest.Mock).mockResolvedValueOnce(
          createMockOutput(input),
        );

        const result: SaveAllocationChangeHistoryOutput =
          await saveAllocationChangeHistory(input);

        expect(result.success).toBe(true);
        expect(result.allocationChangeHistoryId).toBe('AACH-001');
        expect(result.workerId).toBe('WKR-100');
        expect(result.previousPlacementPlanId).toBe('PPL-001');
        expect(result.newPlacementPlanId).toBe('PPL-002');
        expect(result.changeExecutionDate).toEqual(
          new Date('2025-01-15T09:00:00Z'),
        );
        expect(result.status).toBe(status);
        expect(result.savedAt).toBeDefined();
        expect(result.savedAt).toBeInstanceOf(Date);
      });
    });
  });

  it('4 回の連続呼び出しでステータス値が順序通りに反映される', async () => {
    setupMocks();

    const results: SaveAllocationChangeHistoryOutput[] = [];

    for (const status of statusValues) {
      const input: SaveAllocationChangeHistoryInput = {
        ...baseInput,
        status,
      };

      (saveAllocationChangeHistory as jest.Mock).mockResolvedValueOnce(
        createMockOutput(input),
      );

      const result = await saveAllocationChangeHistory(input);
      results.push(result);
    }

    expect(results).toHaveLength(4);

    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.status).toBe(statusValues[index]);
      expect(result.allocationChangeHistoryId).toBe('AACH-001');
      expect(result.workerId).toBe('WKR-100');
      expect(result.previousPlacementPlanId).toBe('PPL-001');
      expect(result.newPlacementPlanId).toBe('PPL-002');
      expect(result.changeExecutionDate).toEqual(
        new Date('2025-01-15T09:00:00Z'),
      );
      expect(result.savedAt).toBeDefined();
    });

    expect(saveAllocationChangeHistory).toHaveBeenCalledTimes(4);
  });

  it('すべてのステータス値が正確に出力に反映される', async () => {
    setupMocks();

    const statusToOutput: Record<string, SaveAllocationChangeHistoryOutput> =
      {};

    for (const status of statusValues) {
      const input: SaveAllocationChangeHistoryInput = {
        ...baseInput,
        status,
      };

      (saveAllocationChangeHistory as jest.Mock).mockResolvedValueOnce(
        createMockOutput(input),
      );

      const result = await saveAllocationChangeHistory(input);
      statusToOutput[status] = result;
    }

    expect(statusToOutput['pending'].status).toBe('pending');
    expect(statusToOutput['approved'].status).toBe('approved');
    expect(statusToOutput['executed'].status).toBe('executed');
    expect(statusToOutput['cancelled'].status).toBe('cancelled');
  });

  it('配置計画・部門・ユーザーの存在確認が実行される', async () => {
    setupMocks();

    const input: SaveAllocationChangeHistoryInput = {
      ...baseInput,
      status: 'pending',
    };

    (saveAllocationChangeHistory as jest.Mock).mockResolvedValueOnce(
      createMockOutput(input),
    );

    await saveAllocationChangeHistory(input);

    expect(findPlacementPlanByWorkerAndDate).toHaveBeenCalled();
    expect(findDepartmentById).toHaveBeenCalled();
    expect(findUserById).toHaveBeenCalled();
  });

  it('変更前後の配置情報がすべて出力に含まれる', async () => {
    setupMocks();

    const input: SaveAllocationChangeHistoryInput = {
      ...baseInput,
      status: 'approved',
    };

    (saveAllocationChangeHistory as jest.Mock).mockResolvedValueOnce(
      createMockOutput(input),
    );

    const result = await saveAllocationChangeHistory(input);

    expect(result.previousPlacementPlanId).toBe('PPL-001');
    expect(result.newPlacementPlanId).toBe('PPL-002');
    expect(result.changeExecutionDate).toEqual(
      new Date('2025-01-15T09:00:00Z'),
    );
    expect(result.status).toBe('approved');
  });
});