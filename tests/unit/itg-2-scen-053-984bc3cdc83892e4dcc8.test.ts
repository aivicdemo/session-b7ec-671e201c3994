import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-053: 配属開始日が過去日付の場合の初期割当案生成', () => {
  it('should generate initial assignment when assignmentStartDate is a past date', async () => {
    const pastDate = '2024-01-15T00:00:00Z';
    const executingUserId = 'admin-user-001';

    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: '仕分け',
      assignedSiteId: 'SITE001',
      assignedTeamId: 'TEAM001',
      assignedDepartmentId: 'DEPT001',
      assignmentStartDate: pastDate,
      executingUserId: executingUserId,
      historicalDataLookbackDays: 90,
    };

    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, {
      validateInputData: jest.fn().mockResolvedValue({ valid: true }),
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      findWorkersByClassificationAndSite: jest
        .fn()
        .mockResolvedValue([
          { workerId: 'W002', classification: '仕分け', siteId: 'SITE001' },
          { workerId: 'W003', classification: '仕分け', siteId: 'SITE001' },
          { workerId: 'W004', classification: '仕分け', siteId: 'SITE001' },
          { workerId: 'W005', classification: '仕分け', siteId: 'SITE001' },
          { workerId: 'W006', classification: '仕分け', siteId: 'SITE001' },
        ]),
      findProductivityDataByWorkerIds: jest.fn().mockResolvedValue([
        {
          workerId: 'W002',
          workDate: '2024-01-10T00:00:00Z',
          productivityRate: 0.95,
          qualityScore: 98,
        },
        {
          workerId: 'W003',
          workDate: '2024-01-10T00:00:00Z',
          productivityRate: 0.88,
          qualityScore: 92,
        },
        {
          workerId: 'W004',
          workDate: '2024-01-10T00:00:00Z',
          productivityRate: 0.92,
          qualityScore: 95,
        },
      ]),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest
        .fn()
        .mockResolvedValue({
          patterns: [
            {
              patternName: 'High Performer',
              description:
                'Workers with consistent high productivity and quality',
              averageProductivityRate: 0.92,
              strengthWorkTypes: ['sorting', 'packing'],
            },
          ],
        }),
      saveInitialAssignment: jest
        .fn()
        .mockResolvedValue('ASSIGN-20240115-001'),
      sendNotificationToAdministrator: jest
        .fn()
        .mockResolvedValue('NOTIF-SENT'),
    });

    expect(output.success).toBe(true);
    expect(output.initialAssignmentId).not.toBeNull();
    expect(output.initialAssignmentId).toBe('ASSIGN-20240115-001');
    expect(output.proposedWorkTypes.length).toBeGreaterThanOrEqual(1);

    output.proposedWorkTypes.forEach((workType) => {
      expect(workType.workTypeId).toBeDefined();
      expect(workType.workTypeName).toBeDefined();
      expect(workType.recommendationReason).toBeDefined();
      expect(typeof workType.expectedProductivityRate).toBe('number');
      expect(workType.expectedProductivityRate).toBeGreaterThanOrEqual(0);
      expect(workType.expectedProductivityRate).toBeLessThanOrEqual(1);
    });

    expect(output.peerProductivityPatterns.length).toBeGreaterThanOrEqual(1);

    output.peerProductivityPatterns.forEach((pattern) => {
      expect(pattern.patternName).toBeDefined();
      expect(pattern.description).toBeDefined();
      expect(typeof pattern.averageProductivityRate).toBe('number');
      expect(Array.isArray(pattern.strengthWorkTypes)).toBe(true);
    });

    expect(output.estimatedProficiencyDays).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(output.estimatedProficiencyDays)).toBe(true);

    expect(output.approverNotificationStatus).toBe('sent');
    expect(output.errorDetails).toBeNull();

    expect(output.executionTimestamp).toBeDefined();
    const executionTime = new Date(output.executionTimestamp);
    const now = new Date();
    expect(executionTime.getTime()).toBeLessThanOrEqual(now.getTime());

    const iso8601Regex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(output.executionTimestamp)).toBe(true);
  });
});