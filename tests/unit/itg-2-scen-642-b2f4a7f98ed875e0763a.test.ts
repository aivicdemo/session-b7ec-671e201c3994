import {
  SaveAllocationChangeHistoryOutput,
  saveAllocationChangeHistory,
} from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
    authorizeUserAction: jest.fn(),
    validateInputData: jest.fn(),
    findPlacementPlanByWorkerAndDate: jest.fn(),
    findDepartmentById: jest.fn(),
    findUserById: jest.fn(),
  };
});

describe('SCEN-642: 割当変更履歴の新規保存テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系：必須項目を全て入力して割当変更履歴を保存すると、成功結果と保存済みの履歴情報が返される', async () => {
    const testStartTime = new Date();

    const testInput = {
      allocationChangeHistoryId: 'ACH-001',
      workerId: 'W001',
      previousPlacementPlanId: 'PPP-001',
      newPlacementPlanId: 'PPP-002',
      previousDepartmentId: 'DEPT-01',
      newDepartmentId: 'DEPT-02',
      previousWorkTypeId: undefined,
      newWorkTypeId: undefined,
      changeReason: '生産性向上',
      changeReasonDetail: undefined,
      changeExecutionDate: new Date(),
      plannedChangeDate: undefined,
      executorUserId: 'EXE-001',
      approverUserId: undefined,
      approvalDateTime: undefined,
      status: 'approved',
      createdBy: 'CREATOR-001',
      requestingUserId: 'REQ-001',
    };

    (persistenceLayer.authorizeUserAction as jest.Mock).mockImplementation(
      (userId) => userId === 'REQ-001'
    );
    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue(true);
    (persistenceLayer.findPlacementPlanByWorkerAndDate as jest.Mock).mockImplementation(
      (input) => {
        if (input.placementPlanId === 'PPP-001' || input.placementPlanId === 'PPP-002') {
          return Promise.resolve({ found: true });
        }
        return Promise.resolve({ found: false });
      }
    );
    (persistenceLayer.findDepartmentById as jest.Mock).mockImplementation(
      (input) => {
        if (input.departmentId === 'DEPT-01' || input.departmentId === 'DEPT-02') {
          return Promise.resolve({ found: true });
        }
        return Promise.resolve({ found: false });
      }
    );
    (persistenceLayer.findUserById as jest.Mock).mockImplementation(
      (input) => {
        if (input.userId === 'EXE-001' || input.userId === 'CREATOR-001') {
          return Promise.resolve({ found: true });
        }
        return Promise.resolve({ found: false });
      }
    );

    const result = await saveAllocationChangeHistory(testInput);

    const testEndTime = new Date();

    expect(result.success).toBe(true);
    expect(result.allocationChangeHistoryId).toBe('ACH-001');
    expect(result.workerId).toBe('W001');
    expect(result.previousPlacementPlanId).toBe('PPP-001');
    expect(result.newPlacementPlanId).toBe('PPP-002');
    expect(result.changeExecutionDate).toEqual(testInput.changeExecutionDate);
    expect(result.status).toBe('approved');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(testStartTime.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(testEndTime.getTime());
  });
});