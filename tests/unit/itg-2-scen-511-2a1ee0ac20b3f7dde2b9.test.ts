import { findPlacementPlansByTeamAndDate } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-511: 複数の有効な配置計画が存在する場合、foundフラグがtrueで全件が返される', () => {
  const requestingUserId = 'USER-123';
  const teamId = 'TEAM-001';
  const targetDate = new Date('2024-01-15');

  const mockPlacementPlans = [
    {
      placementPlanId: 'PP-001',
      workerId: 'WORKER-001',
      placementDepartment: 'DEPT-A',
      placementJobType: 'JOB-TYPE-1',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20'),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      optimizationReason: 'Reason 1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      placementPlanId: 'PP-002',
      workerId: 'WORKER-002',
      placementDepartment: 'DEPT-B',
      placementJobType: 'JOB-TYPE-2',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20'),
      placementStatus: 'active',
      expectedProductivityTarget: 95,
      optimizationReason: 'Reason 2',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      placementPlanId: 'PP-003',
      workerId: 'WORKER-003',
      placementDepartment: 'DEPT-C',
      placementJobType: 'JOB-TYPE-3',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20'),
      placementStatus: 'active',
      expectedProductivityTarget: 110,
      optimizationReason: 'Reason 3',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  beforeEach(() => {
    jest.spyOn(persistenceLayer, 'authorizeUserAction').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all valid placement plans for the team on the target date', async () => {
    jest.spyOn(persistenceLayer, 'findPlacementPlansByTeamAndDate').mockResolvedValue({
      placementPlans: mockPlacementPlans,
      totalCount: 3,
      found: true,
      teamId: 'TEAM-001',
      targetDate: targetDate,
    });

    const result = await findPlacementPlansByTeamAndDate({
      teamId,
      targetDate,
      requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.placementPlans).toHaveLength(3);
    expect(result.teamId).toBe('TEAM-001');
    expect(result.targetDate).toEqual(targetDate);

    const returnedIds = result.placementPlans.map((p) => p.placementPlanId);
    expect(returnedIds).toContain('PP-001');
    expect(returnedIds).toContain('PP-002');
    expect(returnedIds).toContain('PP-003');

    const workerIds = result.placementPlans.map((p) => p.workerId);
    expect(workerIds).toContain('WORKER-001');
    expect(workerIds).toContain('WORKER-002');
    expect(workerIds).toContain('WORKER-003');
    expect(new Set(workerIds).size).toBe(3);

    result.placementPlans.forEach((plan) => {
      expect(plan.placementStatus).toBe('active');
      expect(plan.startDate).toBeLessThanOrEqual(targetDate);
      expect(plan.endDate).toGreaterThanOrEqual(targetDate);
    });

    expect(persistenceLayer.authorizeUserAction).toHaveBeenCalled();
  });
});