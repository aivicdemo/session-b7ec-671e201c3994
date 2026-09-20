import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-031: workInstructionIdがnullの場合、拠点・チーム内の全進行中作業を対象として配置案が生成される', () => {
  it('should generate allocation plans for all in-progress work at facility level when workInstructionId is null', async () => {
    const input = {
      facilityId: 'F001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-123',
      autoApprovalEnabled: true,
    };

    const productivityDataMock = [
      {
        productivityDataId: 'PD001',
        workerId: 'W001',
        workInstructionId: 'WI-001',
        productivityRate: 85,
        qualityScore: 90,
        date: '2024-01-15',
      },
      {
        productivityDataId: 'PD002',
        workerId: 'W002',
        workInstructionId: 'WI-002',
        productivityRate: 78,
        qualityScore: 85,
        date: '2024-01-15',
      },
      {
        productivityDataId: 'PD003',
        workerId: 'W001',
        workInstructionId: 'WI-001',
        productivityRate: 88,
        qualityScore: 92,
        date: '2024-01-16',
      },
      {
        productivityDataId: 'PD004',
        workerId: 'W003',
        workInstructionId: 'WI-003',
        productivityRate: 82,
        qualityScore: 88,
        date: '2024-01-16',
      },
      {
        productivityDataId: 'PD005',
        workerId: 'W002',
        workInstructionId: 'WI-002',
        productivityRate: 80,
        qualityScore: 87,
        date: '2024-01-17',
      },
      {
        productivityDataId: 'PD006',
        workerId: 'W003',
        workInstructionId: 'WI-003',
        productivityRate: 75,
        qualityScore: 80,
        date: '2024-01-17',
      },
    ];

    const workerMock = [
      {
        workerId: 'W001',
        workerName: 'Worker01',
        proficiencyLevel: 3,
        facilityId: 'F001',
        teamId: null,
      },
      {
        workerId: 'W002',
        workerName: 'Worker02',
        proficiencyLevel: 2,
        facilityId: 'F001',
        teamId: null,
      },
      {
        workerId: 'W003',
        workerName: 'Worker03',
        proficiencyLevel: 2,
        facilityId: 'F001',
        teamId: null,
      },
    ];

    const allocationPlansMock = [
      {
        allocationPlanId: 'AP001',
        planName: 'Plan A - High Productivity Focus',
        feasibilityScore: 92,
        recommendedRank: 1,
        status: 'generated',
        targetWorkInstructionIds: ['WI-001', 'WI-002', 'WI-003'],
        expectedProductivityImprovement: 8.5,
        balancesWorkloadAcrossFacility: true,
        facilityCoverageRate: 0.95,
      },
      {
        allocationPlanId: 'AP002',
        planName: 'Plan B - Balanced Distribution',
        feasibilityScore: 88,
        recommendedRank: 2,
        status: 'generated',
        targetWorkInstructionIds: ['WI-001', 'WI-002', 'WI-003'],
        expectedProductivityImprovement: 6.2,
        balancesWorkloadAcrossFacility: true,
        facilityCoverageRate: 0.92,
      },
      {
        allocationPlanId: 'AP003',
        planName: 'Plan C - Risk Mitigation',
        feasibilityScore: 80,
        recommendedRank: 3,
        status: 'generated',
        targetWorkInstructionIds: ['WI-001', 'WI-002', 'WI-003'],
        expectedProductivityImprovement: 3.1,
        balancesWorkloadAcrossFacility: false,
        facilityCoverageRate: 0.80,
      },
    ];

    const authorizeOperationMock = jest.fn().mockImplementation((userId, operation) => {
      expect(userId).toBe('USER-123');
      expect(operation).toMatch(/auto.?approval|auto.?dispatch/i);
      return Promise.resolve(true);
    });

    const validateReferentialIntegrityMock = jest
      .fn()
      .mockImplementation((entity) => {
        expect(entity).toHaveProperty('facilityId', 'F001');
        return Promise.resolve(true);
      });

    const listProductivityDataByConditionMock = jest
      .fn()
      .mockImplementation((condition) => {
        expect(condition).toHaveProperty('facilityId', 'F001');
        expect(condition).toHaveProperty('analysisStartDate', '2024-01-01');
        expect(condition).toHaveProperty('analysisEndDate', '2024-01-31');
        expect(condition).not.toHaveProperty('workInstructionId');
        return Promise.resolve(productivityDataMock);
      });

    const getWorkerWithProficiencyAndProductivityMock = jest
      .fn()
      .mockImplementation((facilityId) => {
        expect(facilityId).toBe('F001');
        return Promise.resolve(workerMock);
      });

    const generateAllocationPlansMock = jest
      .fn()
      .mockImplementation((productivity, workers) => {
        expect(productivity).toBeDefined();
        expect(Array.isArray(productivity)).toBe(true);
        expect(productivity.length).toBeGreaterThanOrEqual(5);
        expect(workers).toBeDefined();
        expect(Array.isArray(workers)).toBe(true);
        expect(workers.length).toBeGreaterThanOrEqual(2);
        const uniqueWorkInstructionIds = new Set(
          productivity.map((d) => d.workInstructionId)
        );
        expect(uniqueWorkInstructionIds.size).toBeGreaterThanOrEqual(3);
        const facilityLevelCoverage = Array.from(uniqueWorkInstructionIds).length;
        expect(facilityLevelCoverage).toBeGreaterThanOrEqual(3);
        return Promise.resolve(allocationPlansMock);
      });

    const judgeAllocationPlanApprovalWithCriteriaMock = jest
      .fn()
      .mockImplementation((plan) => {
        const approvalCriteria = {
          minFeasibilityScore: 85,
          supportsFacilityLevelBalancing: true,
        };
        const isApproved =
          plan.feasibilityScore >= approvalCriteria.minFeasibilityScore;
        if (isApproved) {
          return Promise.resolve({
            approved: true,
            reason: 'Within approval criteria: meets feasibility and facility-level requirements',
          });
        }
        return Promise.resolve({
          approved: false,
          reason: 'Below approval threshold',
        });
      });

    const saveAllocationPlanMock = jest
      .fn()
      .mockImplementation((plan, approvalStatus) => {
        expect(plan.status).toBe('generated');
        expect(approvalStatus).toBe(true);
        const updatedPlan = {
          ...plan,
          status: 'approved',
        };
        return Promise.resolve(updatedPlan);
      });

    const deliverAllocationPlanAndWorkInstructionsMock = jest
      .fn()
      .mockImplementation((approvedPlans) => {
        expect(Array.isArray(approvedPlans)).toBe(true);
        expect(approvedPlans.length).toBeGreaterThanOrEqual(1);
        approvedPlans.forEach((plan) => {
          expect(plan.status).toBe('approved');
        });
        return Promise.resolve({
          deliveredCount: approvedPlans.length,
          failedCount: 0,
          plans: approvedPlans.map((plan) => ({
            allocationPlanId: plan.allocationPlanId,
            planName: plan.planName,
            approvalReason: 'Within approval criteria: meets feasibility and facility-level requirements',
            deliveryStatus: 'delivered',
          })),
        });
      });

    const recordOperationAuditMock = jest
      .fn()
      .mockImplementation((auditData) => {
        expect(auditData).toBeDefined();
        expect(auditData).toHaveProperty('executingUserId', 'USER-123');
        expect(auditData).toHaveProperty('facilityId', 'F001');
        expect(auditData).toHaveProperty('operationType');
        expect(auditData).toHaveProperty('status');
        return Promise.resolve(true);
      });

    const output = await runTx2Imp2Agent(input, {
      authorizeOperation: authorizeOperationMock,
      validateReferentialIntegrity: validateReferentialIntegrityMock,
      listProductivityDataByCondition: listProductivityDataByConditionMock,
      getWorkerWithProficiencyAndProductivity: getWorkerWithProficiencyAndProductivityMock,
      generateAllocationPlans: generateAllocationPlansMock,
      judgeAllocationPlanApprovalWithCriteria: judgeAllocationPlanApprovalWithCriteriaMock,
      saveAllocationPlan: saveAllocationPlanMock,
      deliverAllocationPlanAndWorkInstructions:
        deliverAllocationPlanAndWorkInstructionsMock,
      recordOperationAudit: recordOperationAuditMock,
    });

    expect(output.status).toBe('success');

    expect(output.generatedAllocationPlans).toHaveLength(3);
    expect(output.generatedAllocationPlans.every((plan) => plan.allocationPlanId)).toBe(
      true
    );
    expect(output.generatedAllocationPlans.every((plan) => plan.planName)).toBe(true);
    expect(
      output.generatedAllocationPlans.every(
        (plan) =>
          typeof plan.feasibilityScore === 'number' &&
          plan.feasibilityScore >= 0 &&
          plan.feasibilityScore <= 100
      )
    ).toBe(true);
    expect(
      output.generatedAllocationPlans.every((plan) => plan.recommendedRank >= 1)
    ).toBe(true);
    expect(
      output.generatedAllocationPlans.every((plan) =>
        ['generated', 'approved', 'rejected', 'pending'].includes(plan.status)
      )
    ).toBe(true);

    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('targetWorkInstructionIds');
      expect(Array.isArray(plan.targetWorkInstructionIds)).toBe(true);
      expect(plan.targetWorkInstructionIds.length).toBeGreaterThanOrEqual(3);
      expect(new Set(plan.targetWorkInstructionIds).size).toBeGreaterThanOrEqual(3);
      expect(['WI-001', 'WI-002', 'WI-003'].every((wi) =>
        plan.targetWorkInstructionIds.includes(wi)
      )).toBe(true);
    });

    const approvedPlansByFeasibility = output.generatedAllocationPlans.filter(
      (p) => p.feasibilityScore >= 85
    );
    approvedPlansByFeasibility.forEach((plan) => {
      expect(plan).toHaveProperty('balancesWorkloadAcrossFacility');
      expect(plan).toHaveProperty('facilityCoverageRate');
      if (plan.feasibilityScore >= 85) {
        expect(plan.balancesWorkloadAcrossFacility).toBe(true);
        expect(plan.facilityCoverageRate).toBeGreaterThanOrEqual(0.9);
      }
    });

    expect(output.autoApprovedPlans).toBeDefined();
    expect(Array.isArray(output.autoApprovedPlans)).toBe(true);
    expect(output.autoApprovedPlans.length).toBeGreaterThanOrEqual(1);
    expect(
      output.autoApprovedPlans.every(
        (plan) =>
          plan.allocationPlanId &&
          plan.planName &&
          typeof plan.approvalReason === 'string' &&
          plan.approvalReason.length > 0 &&
          ['delivered', 'pending', 'failed'].includes(plan.deliveryStatus)
      )
    ).toBe(true);

    output.autoApprovedPlans.forEach((approvedPlan) => {
      const correspondingGenerated = output.generatedAllocationPlans.find(
        (gp) => gp.allocationPlanId === approvedPlan.allocationPlanId
      );
      expect(correspondingGenerated).toBeDefined();
      expect(correspondingGenerated?.feasibilityScore).toBeGreaterThanOrEqual(85);
      expect(correspondingGenerated?.status).toBe('approved');
    });

    expect(output.deliveredInstructionCount).toBeGreaterThanOrEqual(1);
    expect(output.failedDeliveryCount).toBe(0);
    expect(output.deliveredInstructionCount + output.failedDeliveryCount).toBe(
      output.autoApprovedPlans.length
    );

    expect(output.analysisMetadata.productivityDataCount).toBeGreaterThanOrEqual(5);
    expect(output.analysisMetadata.workersAnalyzed).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(output.analysisMetadata.proficiencyLevelsApplied)).toBe(true);
    expect(output.analysisMetadata.proficiencyLevelsApplied.length).toBeGreaterThanOrEqual(
      1
    );
    expect(
      output.analysisMetadata.proficiencyLevelsApplied.every(
        (level) => typeof level === 'number' && level >= 1
      )
    ).toBe(true);
    expect(output.analysisMetadata.analysisExecutionTimeMs).toBeGreaterThan(0);

    expect(output.errorDetails).toBeNull();
    expect(output.pendingApprovalPlans).toBeDefined();
    expect(Array.isArray(output.pendingApprovalPlans)).toBe(true);
    expect(output.pendingApprovalPlans).toHaveLength(0);

    expect(authorizeOperationMock).toHaveBeenCalledWith(
      'USER-123',
      expect.any(String)
    );

    expect(validateReferentialIntegrityMock).toHaveBeenCalledWith({
      facilityId: 'F001',
    });

    expect(listProductivityDataByConditionMock).toHaveBeenCalled();
    const callArgs = listProductivityDataByConditionMock.mock.calls[0][0];
    expect(callArgs.facilityId).toBe('F001');
    expect(callArgs.analysisStartDate).toBe('2024-01-01');
    expect(callArgs.analysisEndDate).toBe('2024-01-31');
    expect(callArgs).not.toHaveProperty('workInstructionId');

    expect(getWorkerWithProficiencyAndProductivityMock).toHaveBeenCalledWith('F001');

    expect(generateAllocationPlansMock).toHaveBeenCalled();

    expect(judgeAllocationPlanApprovalWithCriteriaMock).toHaveBeenCalled();

    expect(saveAllocationPlanMock).toHaveBeenCalled();
    saveAllocationPlanMock.mock.calls.forEach((call) => {
      expect(call[1]).toBe(true);
      const savedPlan = call[0];
      const correspondingCall = saveAllocationPlanMock.mock.results.find(
        (result) => result.value && result.value.allocationPlanId === savedPlan.allocationPlanId
      );
      if (correspondingCall && correspondingCall.value) {
        expect(correspondingCall.value.status).toBe('approved');
      }
    });

    expect(deliverAllocationPlanAndWorkInstructionsMock).toHaveBeenCalled();
    const deliverCall = deliverAllocationPlanAndWorkInstructionsMock.mock.calls[0][0];
    expect(Array.isArray(deliverCall)).toBe(true);
    expect(deliverCall.every((p) => p.status === 'approved')).toBe(true);
    expect(deliverCall.length).toBeGreaterThanOrEqual(1);

    expect(recordOperationAuditMock).toHaveBeenCalled();
  });
});