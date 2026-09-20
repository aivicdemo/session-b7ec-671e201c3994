import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import * as auditModule from '../../src/common/audit';

jest.mock('../../src/common/audit');
jest.mock('../../src/data/repositories/productivity-data-repository');
jest.mock('../../src/data/repositories/worker-repository');
jest.mock('../../src/auth/authorization');
jest.mock('../../src/data/integrity');

describe('SCEN-035: 分析対象データが0件の場合', () => {
  let recordOperationAuditSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    recordOperationAuditSpy = jest.spyOn(auditModule, 'recordOperationAudit').mockResolvedValue(undefined);
  });

  afterEach(() => {
    recordOperationAuditSpy.mockRestore();
  });

  it('analysisMetadataのproductivityDataCountが0で返される', async () => {
    // Arrange
    const { validateReferentialIntegrity } = require('../../src/data/integrity');
    const { authorizeOperation } = require('../../src/auth/authorization');
    const { listProductivityDataByCondition, getWorkerWithProficiencyAndProductivity } = require('../../src/data/repositories/productivity-data-repository');

    validateReferentialIntegrity.mockResolvedValue({ valid: true });
    authorizeOperation.mockResolvedValue(true);
    listProductivityDataByCondition.mockResolvedValue([]);
    getWorkerWithProficiencyAndProductivity.mockResolvedValue([]);

    const input = {
      facilityId: 'F001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER001',
      autoApprovalEnabled: true,
    };

    // Act
    const result = await runTx2Imp2Agent(input, {
      listProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity,
      validateReferentialIntegrity,
      authorizeOperation,
      recordOperationAudit: recordOperationAuditSpy,
      generateAllocationPlans: jest.fn().mockResolvedValue([]),
      evaluateAgainstApprovalCriteria: jest.fn().mockResolvedValue({ autoApproved: [], pending: [] }),
      deliverInstructions: jest.fn().mockResolvedValue({ delivered: 0, failed: 0 }),
    });

    // Assert
    expect(result.status).toBe('partial_success');
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.autoApprovedPlans).toBeUndefined();
    expect(result.pendingApprovalPlans).toBeUndefined();
    expect(result.deliveredInstructionCount).toBe(0);
    expect(result.failedDeliveryCount).toBe(0);
    expect(result.analysisMetadata.productivityDataCount).toBe(0);
    expect(result.analysisMetadata.workersAnalyzed).toBe(0);
    expect(result.analysisMetadata.proficiencyLevelsApplied).toEqual([]);
    expect(typeof result.analysisMetadata.analysisExecutionTimeMs).toBe('number');
    expect(result.analysisMetadata.analysisExecutionTimeMs).toBeGreaterThan(0);
    expect(result.errorDetails).toBeNull();

    // Verify audit logging
    expect(recordOperationAuditSpy).toHaveBeenCalled();
    const auditCall = recordOperationAuditSpy.mock.calls[0][0];
    expect(auditCall.executingUserId).toBe('USER001');
    expect(auditCall.status).toBe('partial_success');
    expect(auditCall.analysisMetadata).toBeDefined();
    expect(auditCall.analysisMetadata.productivityDataCount).toBe(0);
  });
});