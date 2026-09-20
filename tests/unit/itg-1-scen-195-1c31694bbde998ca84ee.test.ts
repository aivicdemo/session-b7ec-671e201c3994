import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionDeliveryManager from '../../src/logic/work-instruction-delivery-manager';

jest.mock('../../src/logic/work-instruction-delivery-manager');

describe('SCEN-195: 配置案に紐づく複数の作業指示が存在する場合、全作業指示IDをworkInstructionIdsリストに含めて返す', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetAllocationPlanById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockListWorkersByCondition: jest.Mock;
  let mockGetFacilityById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockSaveAllocationExecutionStatus: jest.Mock;
  let mockSaveWorkInstructionReceptionHistory: jest.Mock;
  let mockDeliverAllocationInstructionToFieldLeader: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockReturnValue(true);
    mockGetAllocationPlanById = jest.fn().mockReturnValue({
      allocationPlanId: 'AP-001',
      status: 'approved',
      facilityId: 'FAC-A',
      teamId: 'TEAM-01',
      targetWorkerCount: 5,
      fieldLeaderId: 'FL-001',
      workInstructionIds: ['WI-001', 'WI-002', 'WI-003'],
    });

    mockGetWorkInstructionById = jest.fn((id) => {
      const workInstructions: Record<string, any> = {
        'WI-001': { workInstructionId: 'WI-001', workName: 'Work 1', priority: 'high' },
        'WI-002': { workInstructionId: 'WI-002', workName: 'Work 2', priority: 'medium' },
        'WI-003': { workInstructionId: 'WI-003', workName: 'Work 3', priority: 'low' },
      };
      return workInstructions[id];
    });

    mockListWorkersByCondition = jest.fn().mockReturnValue([
      { workerId: 'W-001', status: 'active' },
      { workerId: 'W-002', status: 'active' },
      { workerId: 'W-003', status: 'active' },
      { workerId: 'W-004', status: 'active' },
      { workerId: 'W-005', status: 'active' },
    ]);

    mockGetFacilityById = jest.fn().mockReturnValue({
      facilityId: 'FAC-A',
      maxCapacity: 10,
    });

    mockGetTeamById = jest.fn().mockReturnValue({
      teamId: 'TEAM-01',
      teamName: 'Team A',
    });

    mockListAllocationExecutionStatusByCondition = jest.fn().mockReturnValue([]);

    const statusIds = ['AES-001', 'AES-002', 'AES-003'];
    let callCount = 0;
    mockSaveAllocationExecutionStatus = jest.fn(() => {
      const id = statusIds[callCount];
      callCount++;
      return { allocationExecutionStatusId: id };
    });

    mockSaveWorkInstructionReceptionHistory = jest.fn().mockReturnValue({
      receptionHistoryId: 'RH-001',
    });

    mockDeliverAllocationInstructionToFieldLeader = jest.fn().mockReturnValue({
      deliveredChannels: ['email', 'app_notification'],
    });

    mockRecordOperationAudit = jest.fn().mockReturnValue({
      auditLogId: 'AUDIT-001',
    });

    (workInstructionDeliveryManager as any).authorizeOperation = mockAuthorizeOperation;
    (workInstructionDeliveryManager as any).getAllocationPlanById = mockGetAllocationPlanById;
    (workInstructionDeliveryManager as any).getWorkInstructionById = mockGetWorkInstructionById;
    (workInstructionDeliveryManager as any).listWorkersByCondition = mockListWorkersByCondition;
    (workInstructionDeliveryManager as any).getFacilityById = mockGetFacilityById;
    (workInstructionDeliveryManager as any).getTeamById = mockGetTeamById;
    (workInstructionDeliveryManager as any).listAllocationExecutionStatusByCondition = mockListAllocationExecutionStatusByCondition;
    (workInstructionDeliveryManager as any).saveAllocationExecutionStatus = mockSaveAllocationExecutionStatus;
    (workInstructionDeliveryManager as any).saveWorkInstructionReceptionHistory = mockSaveWorkInstructionReceptionHistory;
    (workInstructionDeliveryManager as any).deliverAllocationInstructionToFieldLeader = mockDeliverAllocationInstructionToFieldLeader;
    (workInstructionDeliveryManager as any).recordOperationAudit = mockRecordOperationAudit;
  });

  it('複数の作業指示が存在する場合、全作業指示IDをworkInstructionIdsリストに含めて返す', async () => {
    const input = {
      allocationPlanId: 'AP-001',
      operatingUserId: 'USER-MGR-001',
      deliveryNotes: '緊急配置案',
    };

    const result = await deliverAllocationPlanAndWorkInstructions(input);

    expect(result.workInstructionIds).toEqual(expect.arrayContaining(['WI-001', 'WI-002', 'WI-003']));
    expect(result.workInstructionIds).toHaveLength(3);

    expect(result.deliveryId).toBeDefined();
    expect(typeof result.deliveryId).toBe('string');
    expect(result.allocationPlanId).toBe('AP-001');
    expect(result.facilityId).toBe('FAC-A');
    expect(result.teamId).toBe('TEAM-01');
    expect(result.fieldLeaderId).toBe('FL-001');
    expect(result.targetWorkerCount).toBe(5);
    expect(result.deliveryStatus).toBe('success');
    expect(result.deliveredChannels).toEqual(expect.arrayContaining(['email', 'app_notification']));
    expect(result.failedWorkerIds).toEqual([]);

    expect(result.deliveryTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.expectedReceptionDeadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(result.allocationExecutionStatusIds).toHaveLength(3);
    expect(result.allocationExecutionStatusIds).toEqual(['AES-001', 'AES-002', 'AES-003']);
    expect(result.allocationExecutionStatusIds.every(id => typeof id === 'string' && id.length > 0)).toBe(true);

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USER-MGR-001', 'AP-001');
    expect(mockGetAllocationPlanById).toHaveBeenCalledWith('AP-001');
    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('WI-001');
    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('WI-002');
    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('WI-003');
    expect(mockListWorkersByCondition).toHaveBeenCalled();
    expect(mockGetFacilityById).toHaveBeenCalledWith('FAC-A');
    expect(mockGetTeamById).toHaveBeenCalledWith('TEAM-01');
    expect(mockListAllocationExecutionStatusByCondition).toHaveBeenCalled();
    expect(mockSaveAllocationExecutionStatus).toHaveBeenCalledTimes(3);
    expect(mockDeliverAllocationInstructionToFieldLeader).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });
});