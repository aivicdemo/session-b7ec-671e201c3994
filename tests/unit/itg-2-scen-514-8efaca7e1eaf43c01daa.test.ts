import { jest } from '@jest/globals';
import { saveInitialAssignment, findWorkerById, authorizeUserAction } from '../../src/logic/persistence-layer';

describe('SCEN-514: saveInitialAssignment - 指定された作業者IDが存在しない場合にエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidWorkerIdError when workerId does not exist', async () => {
    const input = {
      assignmentId: 'uuid-001',
      workerId: 'nonexistent-worker-id',
      placementDepartment: 'dept-001',
      placementProcess: 'proc-001',
      assignmentStartDate: new Date('2025-04-01'),
      assignmentEndDate: new Date('2025-06-30'),
      assignmentStatus: 'active',
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    jest.mocked(authorizeUserAction).mockResolvedValue(true);
    jest.mocked(findWorkerById).mockImplementation(async (findInput) => {
      if (findInput.workerId === 'nonexistent-worker-id') {
        return undefined;
      }
      return {
        workerId: findInput.workerId,
        workerName: 'Test Worker',
        siteId: 'site-001',
        teamId: 'team-001',
        jobType: 'job-type-001',
        operatingStatus: 'active',
        found: true,
      };
    });

    let errorThrown: Error | undefined;
    let result: any;
    try {
      result = await saveInitialAssignment(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).toBeDefined();
    expect(errorThrown?.name).toBe('InvalidWorkerIdError');
    expect(errorThrown?.message).toBe('作業者ID nonexistent-worker-id が見つかりません。');
    expect(result).toBeUndefined();
  });
});