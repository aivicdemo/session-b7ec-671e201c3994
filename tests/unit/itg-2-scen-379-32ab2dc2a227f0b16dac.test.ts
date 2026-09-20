import { buildOptimalPlacementProposalScreen } from '../../src/logic/optimal-placement-proposal-presentation';
import * as authorizeModule from '../../src/logic/authorization';
import * as placementModule from '../../src/logic/placement-data';
import * as productivityModule from '../../src/logic/productivity-data';
import * as workerModule from '../../src/logic/worker-data';
import * as departmentModule from '../../src/logic/department-data';
import * as initialAssignmentModule from '../../src/logic/initial-assignment-data';

describe('SCEN-379: buildOptimalPlacementProposalScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalFailure error when findPlacementPlanByWorkerAndDate fails', async () => {
    const input = {
      placement_proposal_id: 'PROP-001',
      user_id: 'USER-123',
      analysis_period_start_date: '2024-01-01',
      analysis_period_end_date: '2024-01-31'
    };

    // Step 2: Configure authorizeUserAction stub to succeed (permission granted)
    jest.spyOn(authorizeModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      userId: 'USER-123'
    });

    // Step 3: Configure findPlacementPlanByWorkerAndDate to throw an exception
    jest.spyOn(placementModule, 'findPlacementPlanByWorkerAndDate').mockRejectedValue(
      new Error('Database connection timeout')
    );
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod').mockResolvedValue([]);
    jest.spyOn(workerModule, 'findWorkersByIds').mockResolvedValue([]);
    jest.spyOn(departmentModule, 'findDepartmentById').mockResolvedValue(null);
    jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker').mockResolvedValue(null);

    // Step 4 & 5: Call buildOptimalPlacementProposalScreen and verify the error
    await expect(buildOptimalPlacementProposalScreen(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'DataRetrievalFailure',
        message: '必要なデータの取得に失敗しました。'
      })
    );
  });

  it('should throw DataRetrievalFailure error when findProductivityDataByWorkerAndPeriod fails', async () => {
    const input = {
      placement_proposal_id: 'PROP-001',
      user_id: 'USER-123',
      analysis_period_start_date: '2024-01-01',
      analysis_period_end_date: '2024-01-31'
    };

    jest.spyOn(authorizeModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      userId: 'USER-123'
    });

    jest.spyOn(placementModule, 'findPlacementPlanByWorkerAndDate').mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod').mockRejectedValue(
      new Error('Database query failed')
    );
    jest.spyOn(workerModule, 'findWorkersByIds').mockResolvedValue([]);
    jest.spyOn(departmentModule, 'findDepartmentById').mockResolvedValue(null);
    jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker').mockResolvedValue(null);

    await expect(buildOptimalPlacementProposalScreen(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'DataRetrievalFailure',
        message: '必要なデータの取得に失敗しました。'
      })
    );
  });

  it('should throw DataRetrievalFailure error when findWorkersByIds fails', async () => {
    const input = {
      placement_proposal_id: 'PROP-001',
      user_id: 'USER-123',
      analysis_period_start_date: '2024-01-01',
      analysis_period_end_date: '2024-01-31'
    };

    jest.spyOn(authorizeModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      userId: 'USER-123'
    });

    jest.spyOn(placementModule, 'findPlacementPlanByWorkerAndDate').mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod').mockResolvedValue([]);
    jest.spyOn(workerModule, 'findWorkersByIds').mockRejectedValue(
      new Error('I/O error')
    );
    jest.spyOn(departmentModule, 'findDepartmentById').mockResolvedValue(null);
    jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker').mockResolvedValue(null);

    await expect(buildOptimalPlacementProposalScreen(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'DataRetrievalFailure',
        message: '必要なデータの取得に失敗しました。'
      })
    );
  });

  it('should throw DataRetrievalFailure error when findDepartmentById fails', async () => {
    const input = {
      placement_proposal_id: 'PROP-001',
      user_id: 'USER-123',
      analysis_period_start_date: '2024-01-01',
      analysis_period_end_date: '2024-01-31'
    };

    jest.spyOn(authorizeModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      userId: 'USER-123'
    });

    jest.spyOn(placementModule, 'findPlacementPlanByWorkerAndDate').mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod').mockResolvedValue([]);
    jest.spyOn(workerModule, 'findWorkersByIds').mockResolvedValue([]);
    jest.spyOn(departmentModule, 'findDepartmentById').mockRejectedValue(
      new Error('Connection timeout')
    );
    jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker').mockResolvedValue(null);

    await expect(buildOptimalPlacementProposalScreen(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'DataRetrievalFailure',
        message: '必要なデータの取得に失敗しました。'
      })
    );
  });

  it('should throw DataRetrievalFailure error when findInitialAssignmentByWorker fails', async () => {
    const input = {
      placement_proposal_id: 'PROP-001',
      user_id: 'USER-123',
      analysis_period_start_date: '2024-01-01',
      analysis_period_end_date: '2024-01-31'
    };

    jest.spyOn(authorizeModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      userId: 'USER-123'
    });

    jest.spyOn(placementModule, 'findPlacementPlanByWorkerAndDate').mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod').mockResolvedValue([]);
    jest.spyOn(workerModule, 'findWorkersByIds').mockResolvedValue([]);
    jest.spyOn(departmentModule, 'findDepartmentById').mockResolvedValue(null);
    jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker').mockRejectedValue(
      new Error('Database error')
    );

    await expect(buildOptimalPlacementProposalScreen(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'DataRetrievalFailure',
        message: '必要なデータの取得に失敗しました。'
      })
    );
  });
});