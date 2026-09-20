import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

// Mock external dependencies
jest.mock('../../src/services/authorization-service', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/repositories/worker-repository', () => ({
  getWorkerById: jest.fn(),
}));

jest.mock('../../src/repositories/productivity-repository', () => ({
  getLatestProductivityDataByWorker: jest.fn(),
}));

jest.mock('../../src/repositories/proficiency-repository', () => ({
  getLatestProficiencyByWorkerAndJobType: jest.fn(),
}));

jest.mock('../../src/repositories/work-instruction-repository', () => ({
  listWorkInstructionsByCondition: jest.fn(),
}));

jest.mock('../../src/services/allocation-plan-service', () => ({
  generateAllocationPlans: jest.fn(),
}));

import { authorizeOperation } from '../../src/services/authorization-service';
import { getWorkerById } from '../../src/repositories/worker-repository';
import { getLatestProductivityDataByWorker } from '../../src/repositories/productivity-repository';
import { getLatestProficiencyByWorkerAndJobType } from '../../src/repositories/proficiency-repository';
import { listWorkInstructionsByCondition } from '../../src/repositories/work-instruction-repository';
import { generateAllocationPlans } from '../../src/services/allocation-plan-service';

describe('SCEN-082: AllocationPlanGenerationFailedError when no viable allocation plan exists', () => {
  const workerId = 'worker-uuid-001';
  const executingUserId = 'user-uuid-001';
  const analysisLookbackDays = 30;
  const minimumProductivityRecordsRequired = 5;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AllocationPlanGenerationFailedError when all teams are full or no skill match exists', async () => {
    // Setup: Authorize operation
    (authorizeOperation as jest.Mock).mockResolvedValueOnce(undefined);

    // Setup: Return valid worker record
    (getWorkerById as jest.Mock).mockResolvedValueOnce({
      workerId,
      workerName: 'Test Worker',
      siteId: 'site-uuid-001',
      teamId: 'team-uuid-001',
      jobType: 'assembly',
      operationStatus: 'active',
    });

    // Setup: Return productivity data meeting minimum requirements
    const productivityData = Array.from({ length: 6 }, (_, i) => ({
      productivityDataId: `prod-id-${i}`,
      workerId,
      workDate: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000),
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedCount: 90,
      productivityRate: 75,
      qualityScore: 85,
    }));
    (getLatestProductivityDataByWorker as jest.Mock).mockResolvedValueOnce(
      productivityData
    );

    // Setup: Return proficiency levels for multiple job types
    const proficiencyData = [
      {
        proficiencyId: 'prof-id-1',
        workerId,
        jobType: 'assembly',
        proficiencyLevel: 3,
        evaluationDate: new Date(),
        dataSource: 'productivity_analysis',
      },
      {
        proficiencyId: 'prof-id-2',
        workerId,
        jobType: 'inspection',
        proficiencyLevel: 2,
        evaluationDate: new Date(),
        dataSource: 'productivity_analysis',
      },
    ];
    (getLatestProficiencyByWorkerAndJobType as jest.Mock).mockResolvedValueOnce(
      proficiencyData
    );

    // Setup: Return available work instructions
    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValueOnce([
      {
        workInstructionId: 'instr-id-1',
        siteId: 'site-uuid-001',
        teamId: 'team-uuid-001',
        workInstructionNumber: 'WI-001',
        workName: 'Assembly Task A',
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        progressStatus: 'in_progress',
        requiredPersonnel: 5,
      },
    ]);

    // Setup: generateAllocationPlans throws AllocationPlanGenerationFailedError
    const allocationError = new Error(
      '初期割当案を生成できません。利用可能なチームまたは作業がありません。'
    );
    (allocationError as any).name = 'AllocationPlanGenerationFailedError';
    (generateAllocationPlans as jest.Mock).mockRejectedValueOnce(
      allocationError
    );

    // Execute
    const promise = runTx5Imp1Agent(
      workerId,
      executingUserId,
      analysisLookbackDays,
      minimumProductivityRecordsRequired
    );

    // Verify: Expect the error to be thrown
    await expect(promise).rejects.toThrow(
      '初期割当案を生成できません。利用可能なチームまたは作業がありません。'
    );

    await expect(promise).rejects.toMatchObject({
      name: 'AllocationPlanGenerationFailedError',
    });

    // Verify: Authorization was checked
    expect(authorizeOperation).toHaveBeenCalledWith(executingUserId);

    // Verify: Worker data was retrieved
    expect(getWorkerById).toHaveBeenCalledWith(workerId);

    // Verify: Productivity data was fetched
    expect(getLatestProductivityDataByWorker).toHaveBeenCalledWith(
      workerId,
      analysisLookbackDays
    );

    // Verify: Proficiency data was retrieved
    expect(getLatestProficiencyByWorkerAndJobType).toHaveBeenCalledWith(
      workerId
    );

    // Verify: Work instructions were listed
    expect(listWorkInstructionsByCondition).toHaveBeenCalled();

    // Verify: Allocation plan generation was attempted
    expect(generateAllocationPlans).toHaveBeenCalled();
  });
});