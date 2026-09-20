import { deliverAllocationInstructionToFieldLeader } from '../../src/logic/notification-external-integration';
import * as allocationService from '../../src/logic/allocation-service';
import * as workInstructionService from '../../src/logic/work-instruction-service';
import * as teamService from '../../src/logic/team-service';
import * as workerService from '../../src/logic/worker-service';
import * as allocationExecutionService from '../../src/logic/allocation-execution-service';
import * as deliveryHistoryService from '../../src/logic/delivery-history-service';
import * as handyTerminalService from '../../src/logic/handy-terminal-service';
import * as wmsService from '../../src/logic/wms-service';

jest.mock('../../src/logic/allocation-service');
jest.mock('../../src/logic/work-instruction-service');
jest.mock('../../src/logic/team-service');
jest.mock('../../src/logic/worker-service');
jest.mock('../../src/logic/allocation-execution-service');
jest.mock('../../src/logic/delivery-history-service');
jest.mock('../../src/logic/handy-terminal-service');
jest.mock('../../src/logic/wms-service');

describe('SCEN-1168: 人員配置案のステータスが承認済み以外のとき、InvalidAllocationPlanStatusエラーで失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidAllocationPlanStatus error when allocation plan status is not approved', async () => {
    const input = {
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      teamId: 'team-001',
      facilityId: 'fac-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      deliveryChannels: ['email', 'app_notification'] as const,
      requestedByUserId: 'user-admin',
      requestedAt: new Date(),
    };

    (allocationService.getAllocationPlanById as jest.Mock).mockResolvedValue({
      allocationPlanId: 'plan-001',
      configurationPlanName: 'test-plan',
      facilityId: 'fac-001',
      teamId: 'team-001',
      workInstructionId: 'instr-001',
      allocationStartDate: new Date(),
      allocationEndDate: null,
      estimatedWorkHours: 100,
      estimatedCompletionDate: null,
      status: 'draft',
      description: 'test description',
      createdAt: new Date(),
      createdBy: 'user-admin',
      updatedAt: new Date(),
      updatedBy: 'user-admin',
    });

    let thrownError: any;
    try {
      await deliverAllocationInstructionToFieldLeader(input);
      fail('Expected InvalidAllocationPlanStatus error to be thrown');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('InvalidAllocationPlanStatus');
    expect(thrownError.message).toBe('人員配置案のステータスが不正です。ステータス: draft');

    expect(allocationService.getAllocationPlanById).toHaveBeenCalledWith('plan-001');
    expect(workInstructionService.getWorkInstructionById).not.toHaveBeenCalled();
    expect(teamService.getTeamById).not.toHaveBeenCalled();
    expect(workerService.getWorkerById).not.toHaveBeenCalled();
    expect(allocationExecutionService.listAllocationExecutionStatusByCondition).not.toHaveBeenCalled();
    expect(deliveryHistoryService.recordWorkInstructionDeliveryHistory).not.toHaveBeenCalled();
    expect(handyTerminalService.recordHandyTerminalSyncLog).not.toHaveBeenCalled();
    expect(wmsService.recordWmsSyncLog).not.toHaveBeenCalled();
  });
});