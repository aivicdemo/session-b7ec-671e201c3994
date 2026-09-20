import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';

// Mock external dependencies
jest.mock('../../src/external/notification-external-integration');
jest.mock('../../src/repositories/allocation-plan-repository');
jest.mock('../../src/repositories/work-instruction-repository');
jest.mock('../../src/repositories/facility-repository');
jest.mock('../../src/repositories/team-repository');
jest.mock('../../src/repositories/allocation-execution-status-repository');
jest.mock('../../src/repositories/work-instruction-reception-history-repository');
jest.mock('../../src/services/authorization-service');
jest.mock('../../src/services/audit-service');

import * as notificationIntegration from '../../src/external/notification-external-integration';
import * as allocationPlanRepo from '../../src/repositories/allocation-plan-repository';
import * as workInstructionRepo from '../../src/repositories/work-instruction-repository';
import * as facilityRepo from '../../src/repositories/facility-repository';
import * as teamRepo from '../../src/repositories/team-repository';
import * as allocationExecutionStatusRepo from '../../src/repositories/allocation-execution-status-repository';
import * as workInstructionReceptionHistoryRepo from '../../src/repositories/work-instruction-reception-history-repository';
import * as authService from '../../src/services/authorization-service';
import * as auditService from '../../src/services/audit-service';

describe('SCEN-189: Delivery Channel Unavailable Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DeliveryChannelUnavailableError when field leader delivery channel is unavailable', async () => {
    // Setup test data
    const allocationPlanId = 'AP-001';
    const operatingUserId = 'USER-001';
    const facilityId = 'FAC-001';
    const teamId = 'TEAM-001';
    const fieldLeaderId = 'FL-001';
    const workInstructionIds = ['WI-001', 'WI-002'];
    const deliveryNotes = '緊急配置';

    // Mock authorization service - grant delivery permission
    (authService.authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      userId: operatingUserId,
      resourceId: allocationPlanId,
      action: 'deliver',
    });

    // Mock allocation plan repository - return approved plan
    (allocationPlanRepo.getAllocationPlanById as jest.Mock).mockResolvedValue({
      id: allocationPlanId,
      status: 'approved',
      facilityId,
      teamId,
      fieldLeaderId,
      createdAt: new Date().toISOString(),
    });

    // Mock work instruction repository - return valid work instructions
    (workInstructionRepo.getWorkInstructionById as jest.Mock).mockImplementation(
      (id: string) => Promise.resolve({
        id,
        allocationPlanId,
        status: 'active',
        createdAt: new Date().toISOString(),
      })
    );

    // Mock facility repository
    (facilityRepo.getFacilityById as jest.Mock).mockResolvedValue({
      id: facilityId,
      name: 'Facility 001',
    });

    // Mock team repository
    (teamRepo.getTeamById as jest.Mock).mockResolvedValue({
      id: teamId,
      name: 'Team 001',
    });

    // Mock notification service to throw DeliveryChannelUnavailableError
    const deliveryChannelError = new Error('DeliveryChannelUnavailableError');
    (deliveryChannelError as any).name = 'DeliveryChannelUnavailableError';
    (deliveryChannelError as any).message = `配信チャネルが利用できません。現場リーダーID: ${fieldLeaderId}`;
    (notificationIntegration.deliverAllocationInstructionToFieldLeader as jest.Mock).mockRejectedValue(
      deliveryChannelError
    );

    const input = {
      allocationPlanId,
      operatingUserId,
      deliveryNotes,
    };

    // Execute and verify error is thrown
    await expect(deliverAllocationPlanAndWorkInstructions(input)).rejects.toThrow(
      'DeliveryChannelUnavailableError'
    );

    // Verify error message matches expected format
    try {
      await deliverAllocationPlanAndWorkInstructions(input);
    } catch (error: any) {
      expect(error.name).toBe('DeliveryChannelUnavailableError');
      expect(error.message).toBe(`配信チャネルが利用できません。現場リーダーID: ${fieldLeaderId}`);
    }

    // Verify side effects did not occur
    expect(allocationExecutionStatusRepo.saveAllocationExecutionStatus as jest.Mock).not.toHaveBeenCalled();
    expect(workInstructionReceptionHistoryRepo.saveWorkInstructionReceptionHistory as jest.Mock).not.toHaveBeenCalled();
    expect(auditService.recordOperationAudit as jest.Mock).not.toHaveBeenCalled();

    // Verify authorization was checked
    expect(authService.authorizeOperation as jest.Mock).toHaveBeenCalledWith(
      operatingUserId,
      'deliver',
      allocationPlanId
    );

    // Verify allocation plan was retrieved
    expect(allocationPlanRepo.getAllocationPlanById as jest.Mock).toHaveBeenCalledWith(allocationPlanId);
  });
});