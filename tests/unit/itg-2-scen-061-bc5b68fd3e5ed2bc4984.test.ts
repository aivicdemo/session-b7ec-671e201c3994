import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-061: 承認者への通知が失敗した場合でも、初期割当案は保存される', () => {
  it('承認者への通知失敗時に、初期割当案は保存されており、ApproverNotificationFailureErrorで通知失敗のみが報告される', async () => {
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'picker',
      assignedSiteId: 'S001',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2024-01-15',
      executingUserId: 'U001',
      historicalDataLookbackDays: 90,
    };

    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, {
      authenticateUser: async (userId: string) => {
        if (userId === 'U001') {
          return { userId, isValid: true, role: 'administrator' };
        }
        throw new Error('Authentication failed');
      },
      authorizeUserAction: async (userId: string, action: string) => {
        if (userId === 'U001' && action === 'generate_initial_assignment') {
          return { userId, action, authorized: true };
        }
        return { userId, action, authorized: false };
      },
      validateInputData: async (data: Tx5Imp1AgentInput) => {
        if (data.newAssigneeWorkerId && data.jobClassification && data.assignedSiteId) {
          return { valid: true, errors: [] };
        }
        return { valid: false, errors: ['Missing required fields'] };
      },
      findWorkersByClassificationAndSite: async (jobClassification: string, siteId: string) => {
        return [
          {
            workerId: 'W002',
            name: 'John Doe',
            jobClassification,
            siteId,
            createdAt: new Date(),
          },
          {
            workerId: 'W003',
            name: 'Jane Smith',
            jobClassification,
            siteId,
            createdAt: new Date(),
          },
        ];
      },
      findProductivityDataByWorkerIds: async (workerIds: string[], days: number) => {
        return [
          {
            productivityDataId: 'PD001',
            workerId: 'W002',
            workDate: new Date('2024-01-10'),
            completedCount: 150,
            workTimeMinutes: 480,
            productivityRate: 95,
            qualityScore: 92,
            errorCount: 2,
          },
          {
            productivityDataId: 'PD002',
            workerId: 'W003',
            workDate: new Date('2024-01-10'),
            completedCount: 145,
            workTimeMinutes: 480,
            productivityRate: 90,
            qualityScore: 88,
            errorCount: 3,
          },
        ];
      },
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async (
        _data: any,
        _productivityData: any,
      ) => {
        return {
          proposedWorkTypes: [
            {
              workTypeId: 'WT001',
              workTypeName: 'Picking Task A',
              recommendationReason: 'High success rate from peer group',
              expectedProductivityRate: 92,
            },
            {
              workTypeId: 'WT002',
              workTypeName: 'Picking Task B',
              recommendationReason: 'Moderate complexity, suitable for onboarding',
              expectedProductivityRate: 85,
            },
          ],
          peerProductivityPatterns: [
            {
              patternName: 'Standard Picker Pattern',
              description: 'Typical productivity pattern for picker role',
              averageProductivityRate: 92,
              strengthWorkTypes: ['WT001', 'WT002'],
            },
          ],
          estimatedProficiencyDays: 14,
        };
      },
      saveInitialAssignment: async (_assignmentData: any) => {
        return {
          initialAssignmentId: '550e8400-e29b-41d4-a716-446655440000',
          success: true,
        };
      },
      sendNotificationToAdministrator: async (_data: any) => {
        throw new Error('Failed to send notification to approver');
      },
    });

    expect(output.success).toBe(false);
    expect(output.initialAssignmentId).not.toBeNull();
    expect(output.initialAssignmentId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(output.proposedWorkTypes).toBeDefined();
    expect(Array.isArray(output.proposedWorkTypes)).toBe(true);
    expect(output.proposedWorkTypes.length).toBeGreaterThan(0);
    output.proposedWorkTypes.forEach((workType) => {
      expect(workType.workTypeId).toBeDefined();
      expect(typeof workType.workTypeId).toBe('string');
      expect(workType.workTypeName).toBeDefined();
      expect(typeof workType.workTypeName).toBe('string');
      expect(workType.recommendationReason).toBeDefined();
      expect(typeof workType.recommendationReason).toBe('string');
      expect(workType.expectedProductivityRate).toBeDefined();
      expect(typeof workType.expectedProductivityRate).toBe('number');
    });
    expect(output.peerProductivityPatterns).toBeDefined();
    expect(Array.isArray(output.peerProductivityPatterns)).toBe(true);
    expect(output.peerProductivityPatterns.length).toBeGreaterThan(0);
    output.peerProductivityPatterns.forEach((pattern) => {
      expect(pattern.patternName).toBeDefined();
      expect(typeof pattern.patternName).toBe('string');
      expect(pattern.description).toBeDefined();
      expect(typeof pattern.description).toBe('string');
      expect(pattern.averageProductivityRate).toBeDefined();
      expect(typeof pattern.averageProductivityRate).toBe('number');
      expect(pattern.strengthWorkTypes).toBeDefined();
      expect(Array.isArray(pattern.strengthWorkTypes)).toBe(true);
    });
    expect(output.estimatedProficiencyDays).toBeGreaterThan(0);
    expect(output.approverNotificationStatus).toBe('failed');
    expect(output.errorDetails).toBe(
      '承認者への通知に失敗しました。初期割当案は生成されましたが、承認者に届いていない可能性があります。',
    );
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});