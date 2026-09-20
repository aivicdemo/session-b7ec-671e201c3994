import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-046: Initial assignment generation for new assignee', () => {
  let result: Tx5Imp1AgentOutput;

  beforeAll(async () => {
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'NEW-WKR-0001',
      jobClassification: 'picker',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-001',
      assignmentStartDate: '2025-01-15T00:00:00Z',
      executingUserId: 'admin-user-001',
      historicalDataLookbackDays: 90,
    };

    result = await runTx5Imp1Agent(input, {} as any);
  });

  it('should return success flag as true', () => {
    expect(result.success).toBe(true);
  });

  it('should return non-null initialAssignmentId', () => {
    expect(result.initialAssignmentId).not.toBeNull();
    expect(typeof result.initialAssignmentId).toBe('string');
    expect(result.initialAssignmentId).toMatch(/^ASSIGN-/);
  });

  it('should return 3 to 5 proposed work types with required fields', () => {
    expect(result.proposedWorkTypes).toBeDefined();
    expect(Array.isArray(result.proposedWorkTypes)).toBe(true);
    expect(result.proposedWorkTypes.length).toBeGreaterThanOrEqual(3);
    expect(result.proposedWorkTypes.length).toBeLessThanOrEqual(5);

    result.proposedWorkTypes.forEach((workType) => {
      expect(workType.workTypeId).toBeDefined();
      expect(typeof workType.workTypeId).toBe('string');
      expect(workType.workTypeName).toBeDefined();
      expect(typeof workType.workTypeName).toBe('string');
      expect(workType.recommendationReason).toBeDefined();
      expect(typeof workType.recommendationReason).toBe('string');
      expect(workType.expectedProductivityRate).toBeDefined();
      expect(typeof workType.expectedProductivityRate).toBe('number');
      expect(workType.expectedProductivityRate).toBeGreaterThanOrEqual(0.0);
      expect(workType.expectedProductivityRate).toBeLessThanOrEqual(1.0);
    });
  });

  it('should return 3 to 5 peer productivity patterns with required fields', () => {
    expect(result.peerProductivityPatterns).toBeDefined();
    expect(Array.isArray(result.peerProductivityPatterns)).toBe(true);
    expect(result.peerProductivityPatterns.length).toBeGreaterThanOrEqual(3);
    expect(result.peerProductivityPatterns.length).toBeLessThanOrEqual(5);

    result.peerProductivityPatterns.forEach((pattern) => {
      expect(pattern.patternName).toBeDefined();
      expect(typeof pattern.patternName).toBe('string');
      expect(pattern.description).toBeDefined();
      expect(typeof pattern.description).toBe('string');
      expect(pattern.averageProductivityRate).toBeDefined();
      expect(typeof pattern.averageProductivityRate).toBe('number');
      expect(pattern.strengthWorkTypes).toBeDefined();
      expect(Array.isArray(pattern.strengthWorkTypes)).toBe(true);
    });
  });

  it('should return estimatedProficiencyDays in range 7-30', () => {
    expect(result.estimatedProficiencyDays).toBeDefined();
    expect(typeof result.estimatedProficiencyDays).toBe('number');
    expect(result.estimatedProficiencyDays).toBeGreaterThanOrEqual(7);
    expect(result.estimatedProficiencyDays).toBeLessThanOrEqual(30);
  });

  it('should return approverNotificationStatus as sent', () => {
    expect(result.approverNotificationStatus).toBe('sent');
  });

  it('should return errorDetails as null on success', () => {
    expect(result.errorDetails).toBeNull();
  });

  it('should return executionTimestamp in ISO 8601 format', () => {
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    expect(() => new Date(result.executionTimestamp)).not.toThrow();
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });
});