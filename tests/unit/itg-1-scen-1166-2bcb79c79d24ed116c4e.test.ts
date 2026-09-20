import { deliverAllocationInstructionToFieldLeader } from '../../src/logic/notification-external-integration';
import * as notificationModule from '../../src/logic/notification-external-integration';

describe('SCEN-1166: 配置案に指定されたチームの現場リーダーが存在しないまたは非稼働のとき、FieldLeaderNotFoundエラーで失敗する', () => {
  let getAllocationPlanByIdSpy: jest.SpyInstance;
  let getWorkInstructionByIdSpy: jest.SpyInstance;
  let getTeamByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getAllocationPlanByIdSpy = jest.spyOn(notificationModule, 'getAllocationPlanById' as any);
    getWorkInstructionByIdSpy = jest.spyOn(notificationModule, 'getWorkInstructionById' as any);
    getTeamByIdSpy = jest.spyOn(notificationModule, 'getTeamById' as any);
  });

  afterEach(() => {
    getAllocationPlanByIdSpy.mockRestore();
    getWorkInstructionByIdSpy.mockRestore();
    getTeamByIdSpy.mockRestore();
  });

  it('現場リーダーが存在しないまたは非稼働の場合、FieldLeaderNotFoundエラーをスローし、出力を生成しない', async () => {
    const input = {
      allocationPlanId: 'plan-123',
      workInstructionId: 'work-456',
      teamId: 'team-789',
      facilityId: 'facility-001',
      allocatedWorkerIds: ['worker-1', 'worker-2'],
      deliveryChannels: ['email' as const, 'app_notification' as const],
      requestedByUserId: 'user-admin',
      requestedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const approvedAllocationPlan = {
      allocationPlanId: input.allocationPlanId,
      status: 'approved' as const,
      teamId: input.teamId,
      workInstructionId: input.workInstructionId,
    };

    const validWorkInstruction = {
      workInstructionId: input.workInstructionId,
      status: 'active',
    };

    const teamWithNoFieldLeader = {
      teamId: input.teamId,
      fieldLeaderId: null,
      status: 'active',
    };

    getAllocationPlanByIdSpy.mockResolvedValue(approvedAllocationPlan);
    getWorkInstructionByIdSpy.mockResolvedValue(validWorkInstruction);
    getTeamByIdSpy.mockResolvedValue(teamWithNoFieldLeader);

    let thrownError: any = null;
    let output: any = undefined;

    try {
      output = await deliverAllocationInstructionToFieldLeader(input);
      fail('Expected FieldLeaderNotFoundError to be thrown');
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError.name).toBe('FieldLeaderNotFoundError');
    expect(thrownError.message).toBe(`現場リーダーが見つかりません。チームID: ${input.teamId}`);
    expect(output).toBeUndefined();
  });

  it('現場リーダーの稼働状況が非稼働の場合、FieldLeaderNotFoundエラーをスローし、出力を生成しない', async () => {
    const input = {
      allocationPlanId: 'plan-124',
      workInstructionId: 'work-457',
      teamId: 'team-790',
      facilityId: 'facility-001',
      allocatedWorkerIds: ['worker-3', 'worker-4'],
      deliveryChannels: ['email' as const, 'app_notification' as const],
      requestedByUserId: 'user-admin',
      requestedAt: new Date('2024-01-15T11:00:00Z'),
    };

    const approvedAllocationPlan = {
      allocationPlanId: input.allocationPlanId,
      status: 'approved' as const,
      teamId: input.teamId,
      workInstructionId: input.workInstructionId,
    };

    const validWorkInstruction = {
      workInstructionId: input.workInstructionId,
      status: 'active',
    };

    const teamWithInactiveFieldLeader = {
      teamId: input.teamId,
      fieldLeaderId: 'leader-001',
      fieldLeaderStatus: 'inactive',
      status: 'active',
    };

    getAllocationPlanByIdSpy.mockResolvedValue(approvedAllocationPlan);
    getWorkInstructionByIdSpy.mockResolvedValue(validWorkInstruction);
    getTeamByIdSpy.mockResolvedValue(teamWithInactiveFieldLeader);

    let thrownError: any = null;
    let output: any = undefined;

    try {
      output = await deliverAllocationInstructionToFieldLeader(input);
      fail('Expected FieldLeaderNotFoundError to be thrown');
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError.name).toBe('FieldLeaderNotFoundError');
    expect(thrownError.message).toBe(`現場リーダーが見つかりません。チームID: ${input.teamId}`);
    expect(output).toBeUndefined();
  });
});