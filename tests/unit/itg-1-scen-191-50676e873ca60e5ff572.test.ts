import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';
import * as allocationRepository from '../../src/repositories/allocation-repository';
import * as workInstructionRepository from '../../src/repositories/work-instruction-repository';
import * as allocationExecutionStatusRepository from '../../src/repositories/allocation-execution-status-repository';
import * as workInstructionReceptionHistoryRepository from '../../src/repositories/work-instruction-reception-history-repository';
import * as authorizationService from '../../src/services/authorization-service';

jest.mock('../../src/repositories/allocation-repository');
jest.mock('../../src/repositories/work-instruction-repository');
jest.mock('../../src/repositories/allocation-execution-status-repository');
jest.mock('../../src/repositories/work-instruction-reception-history-repository');
jest.mock('../../src/services/authorization-service');

describe('SCEN-191: AllocationConflict エラーケース', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('配置案に含まれる作業者が既に他の作業指示に配置されており同時配置が不可である場合、AllocationConflictエラーで拒否する', async () => {
    const allocationPlanId = 'APL-001';
    const operatingUserId = 'OP-001';
    const facilityId = 'FAC-001';
    const teamId = 'TEAM-001';
    const workerId = 'W001';
    const existingAllocationId = 'ALLOC-999';
    const existingWorkInstructionId = 'WI-999';

    // 承認済みの人員配置案を準備
    (allocationRepository.getAllocationPlanById as jest.Mock).mockResolvedValue({
      allocationPlanId,
      facilityId,
      teamId,
      status: 'approved',
      targetWorkers: [
        { workerId: 'W001', workerName: 'Worker 1' },
        { workerId: 'W002', workerName: 'Worker 2' },
      ],
      workInstructionIds: ['WI-001', 'WI-002'],
    });

    // 配置案に紐づく作業指示を準備
    (workInstructionRepository.getWorkInstructionById as jest.Mock)
      .mockResolvedValueOnce({
        workInstructionId: 'WI-001',
        workName: 'Task 1',
      })
      .mockResolvedValueOnce({
        workInstructionId: 'WI-002',
        workName: 'Task 2',
      });

    // 作業者W001が既に他の作業指示に配置されている状態を準備
    (allocationExecutionStatusRepository.listAllocationExecutionStatusByCondition as jest.Mock)
      .mockResolvedValue([
        {
          allocationExecutionStatusId: existingAllocationId,
          workInstructionId: existingWorkInstructionId,
          workerId,
          configStatus: 'active',
        },
      ]);

    // 操作ユーザーに必要な権限があることを確認
    (authorizationService.authorizeOperation as jest.Mock).mockResolvedValue(
      true
    );

    const input = {
      allocationPlanId,
      operatingUserId,
      deliveryNotes: null,
    };

    // AllocationConflictエラーが発生することを検証
    await expect(
      deliverAllocationPlanAndWorkInstructions(input)
    ).rejects.toMatchObject({
      name: 'AllocationConflictError',
      message: expect.stringContaining(
        `作業者の配置が競合しています。作業者ID: ${workerId}, 既存配置: ${existingAllocationId}`
      ),
    });

    // 配信処理が中止されたことを検証
    expect(
      allocationExecutionStatusRepository.saveAllocationExecutionStatus
    ).not.toHaveBeenCalled();
    expect(
      workInstructionReceptionHistoryRepository.saveWorkInstructionReceptionHistory
    ).not.toHaveBeenCalled();
  });
});