import { findInitialAssignmentByWorker } from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-528: 初期割当レコードが見つからなかった場合、出力のfoundフィールドがfalseに設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期割当レコードなしの場合、foundがfalseで返される', async () => {
    const workerId = 'WORKER-001';
    const requestingUserId = 'USER-123';

    (findInitialAssignmentByWorker as jest.Mock).mockResolvedValue({
      assignmentId: null,
      workerId: null,
      placementDepartment: null,
      placementProcess: null,
      assignmentStartDate: null,
      assignmentEndDate: null,
      assignmentStatus: null,
      remarks: null,
      createdAt: null,
      updatedAt: null,
      found: false,
    });

    const result = await findInitialAssignmentByWorker({
      workerId,
      requestingUserId,
    });

    expect(result.found).toBe(false);
    expect(result.assignmentId).toBeNull();
    expect(result.workerId).toBeNull();
    expect(result.placementDepartment).toBeNull();
    expect(result.placementProcess).toBeNull();
    expect(result.assignmentStartDate).toBeNull();
    expect(result.assignmentEndDate).toBeNull();
    expect(result.assignmentStatus).toBeNull();
    expect(result.remarks).toBeNull();
    expect(result.createdAt).toBeNull();
    expect(result.updatedAt).toBeNull();
  });
});