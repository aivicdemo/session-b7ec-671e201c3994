import { savePlacementPlan, SavePlacementPlanInput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

// Create a custom error class for WorkerNotFoundError
class WorkerNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerNotFoundError';
    Object.setPrototypeOf(this, WorkerNotFoundError.prototype);
  }
}

describe('SCEN-492: SavePlacementPlan - WorkerNotFoundError when worker does not exist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkerNotFoundError when specified worker is not found in worker master', async () => {
    const input: SavePlacementPlanInput = {
      placementPlanId: 'new-plan-uuid-12345',
      workerId: 'nonexistent-worker-id-12345',
      placementDepartment: 'Department-A',
      placementJobType: 'Assembly',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      placementStatus: 'active',
      expectedProductivityTarget: 85,
      optimizationReason: 'Skill matching for production efficiency',
      createdBy: 'admin-user-001',
      requestingUserId: 'admin-user-001',
      operation: 'create',
    };

    // Mock authorizeUserAction to return true (permission granted) for the requesting user
    const authorizeUserActionSpy = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockImplementation(
      (userId: string) => {
        if (userId === 'admin-user-001') {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }
    );

    // Mock validateInputData to return success (no exception) for the input
    const validateInputDataSpy = jest.spyOn(persistenceLayer, 'validateInputData' as any).mockImplementation(
      (inputData: SavePlacementPlanInput) => {
        if (inputData === input) {
          return Promise.resolve(undefined);
        }
        return Promise.reject(new Error('Validation failed'));
      }
    );

    // Mock findWorkerById to return null for the nonexistent worker
    const findWorkerByIdSpy = jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockImplementation(
      (workerId: string) => {
        if (workerId === 'nonexistent-worker-id-12345') {
          return Promise.resolve(null);
        }
        return Promise.resolve({ workerId, workerName: 'Test Worker' });
      }
    );

    // Mock the database save function to ensure it is NOT called
    const savePlacementPlanDbSpy = jest.spyOn(persistenceLayer, 'savePlacementPlanDb' as any).mockResolvedValue(
      { placementPlanId: 'new-plan-uuid-12345' }
    );

    // Verify that WorkerNotFoundError is thrown with the correct message
    await expect(savePlacementPlan(input)).rejects.toThrow(WorkerNotFoundError);
    await expect(savePlacementPlan(input)).rejects.toThrow('指定された作業者が見つかりません。');

    // Verify that the database save was never called
    expect(savePlacementPlanDbSpy).not.toHaveBeenCalled();

    // Verify the helper functions were called with correct parameters
    expect(authorizeUserActionSpy).toHaveBeenCalledWith('admin-user-001');
    expect(validateInputDataSpy).toHaveBeenCalledWith(input);
    expect(findWorkerByIdSpy).toHaveBeenCalledWith('nonexistent-worker-id-12345');
  });

  it('should throw WorkerNotFoundError when findWorkerById raises the error', async () => {
    const input: SavePlacementPlanInput = {
      placementPlanId: 'new-plan-uuid-12346',
      workerId: 'another-nonexistent-worker-id',
      placementDepartment: 'Department-B',
      placementJobType: 'Packing',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-01'),
      placementStatus: 'active',
      expectedProductivityTarget: 80,
      optimizationReason: 'Capacity planning',
      createdBy: 'admin-user-002',
      requestingUserId: 'admin-user-002',
      operation: 'create',
    };

    // Mock authorizeUserAction to return true
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockImplementation(
      (userId: string) => {
        if (userId === 'admin-user-002') {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }
    );

    // Mock validateInputData to return success
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockImplementation(
      (inputData: SavePlacementPlanInput) => {
        if (inputData === input) {
          return Promise.resolve(undefined);
        }
        return Promise.reject(new Error('Validation failed'));
      }
    );

    // Mock findWorkerById to throw WorkerNotFoundError
    jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockRejectedValue(
      new WorkerNotFoundError('指定された作業者が見つかりません。')
    );

    // Mock the database save function to ensure it is NOT called
    const savePlacementPlanDbSpy = jest.spyOn(persistenceLayer, 'savePlacementPlanDb' as any).mockResolvedValue(
      { placementPlanId: 'new-plan-uuid-12346' }
    );

    // Verify that WorkerNotFoundError is thrown with the correct message
    await expect(savePlacementPlan(input)).rejects.toThrow(WorkerNotFoundError);
    await expect(savePlacementPlan(input)).rejects.toThrow('指定された作業者が見つかりません。');

    // Verify that the database save was never called
    expect(savePlacementPlanDbSpy).not.toHaveBeenCalled();
  });
});