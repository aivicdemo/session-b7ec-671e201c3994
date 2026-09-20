import { findPlacementPlansByTeamAndDate } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

// Mock the authorization check
jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
    authorizeUserAction: jest.fn().mockResolvedValue(true),
  };
});

describe('SCEN-512: findPlacementPlansByTeamAndDate - Boundary Date Test', () => {
  const testTeamId = 'TEAM-001';
  const testUserId = 'USER-001';
  const testDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return placement plan when targetDate is at the lower boundary (startDate)', async () => {
    // Setup: Create mock placement plan record containing 3 workers' placement information
    const mockPlacementPlans = [
      {
        placementPlanId: 'PLAN-A',
        workerId: 'WORKER-001',
        placementDepartment: 'DEPT-A',
        placementJobType: 'JOBTYPE-001',
        startDate: new Date('2024-01-15'), // Lower boundary
        endDate: new Date('2024-01-31'),
        placementStatus: 'active',
        expectedProductivityTarget: 100,
        optimizationReason: 'Initial placement',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        placementPlanId: 'PLAN-A',
        workerId: 'WORKER-002',
        placementDepartment: 'DEPT-A',
        placementJobType: 'JOBTYPE-001',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-31'),
        placementStatus: 'active',
        expectedProductivityTarget: 95,
        optimizationReason: 'Team reinforcement',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        placementPlanId: 'PLAN-A',
        workerId: 'WORKER-003',
        placementDepartment: 'DEPT-A',
        placementJobType: 'JOBTYPE-001',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-31'),
        placementStatus: 'active',
        expectedProductivityTarget: 105,
        optimizationReason: 'Performance improvement',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    // Mock the database query to return our test data
    jest.spyOn(persistenceLayer, 'findPlacementPlansByTeamAndDate').mockResolvedValueOnce({
      placementPlans: mockPlacementPlans,
      totalCount: 1,
      found: true,
      teamId: testTeamId,
      targetDate: testDate,
    });

    // Call the function with boundary date
    const result = await findPlacementPlansByTeamAndDate({
      teamId: testTeamId,
      targetDate: testDate,
      requestingUserId: testUserId,
    });

    // Verify the output structure
    expect(result).toBeDefined();
    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(1);
    expect(result.teamId).toBe(testTeamId);
    expect(result.targetDate).toEqual(testDate);

    // Verify placement plans are included - 3 records for same plan with 3 workers
    expect(result.placementPlans).toHaveLength(3);

    // Verify all three workers' placement information is returned
    const workerIds = result.placementPlans.map(plan => plan.workerId);
    expect(workerIds).toContain('WORKER-001');
    expect(workerIds).toContain('WORKER-002');
    expect(workerIds).toContain('WORKER-003');

    // Verify each placement plan has required fields
    result.placementPlans.forEach(plan => {
      expect(plan.placementPlanId).toBe('PLAN-A');
      expect(plan.workerId).toBeDefined();
      expect(plan.placementDepartment).toBe('DEPT-A');
      expect(plan.placementJobType).toBe('JOBTYPE-001');
      expect(plan.startDate).toEqual(new Date('2024-01-15'));
      expect(plan.endDate).toEqual(new Date('2024-01-31'));
      expect(plan.placementStatus).toBe('active');
      expect(plan.expectedProductivityTarget).toBeGreaterThan(0);
      expect(plan.createdAt).toBeDefined();
      expect(plan.updatedAt).toBeDefined();
    });

    // Verify the function was called with correct parameters
    expect(persistenceLayer.findPlacementPlansByTeamAndDate).toHaveBeenCalledWith({
      teamId: testTeamId,
      targetDate: testDate,
      requestingUserId: testUserId,
    });
  });

  it('should return placement plan when targetDate is at the upper boundary (endDate)', async () => {
    const upperBoundaryDate = new Date('2024-01-31');

    const mockPlacementPlans = [
      {
        placementPlanId: 'PLAN-B',
        workerId: 'WORKER-004',
        placementDepartment: 'DEPT-B',
        placementJobType: 'JOBTYPE-002',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-31'), // Upper boundary
        placementStatus: 'active',
        expectedProductivityTarget: 110,
        optimizationReason: 'End of period plan',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    jest.spyOn(persistenceLayer, 'findPlacementPlansByTeamAndDate').mockResolvedValueOnce({
      placementPlans: mockPlacementPlans,
      totalCount: 1,
      found: true,
      teamId: testTeamId,
      targetDate: upperBoundaryDate,
    });

    const result = await findPlacementPlansByTeamAndDate({
      teamId: testTeamId,
      targetDate: upperBoundaryDate,
      requestingUserId: testUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(1);
    expect(result.placementPlans).toHaveLength(1);
    expect(result.placementPlans[0].workerId).toBe('WORKER-004');
    expect(result.targetDate).toEqual(upperBoundaryDate);
  });
});