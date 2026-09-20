import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as authModule from '../../src/auth/authenticate';
import * as authzModule from '../../src/auth/authorize';
import * as validationModule from '../../src/validation/validate-input';
import * as workerModule from '../../src/workers/find-workers';
import * as productivityModule from '../../src/productivity/find-productivity-data';
import * as cacheModule from '../../src/cache/retrieve-cache';
import * as persistenceModule from '../../src/persistence/save-initial-assignment';
import * as notificationModule from '../../src/notification/send-notification';

class PerformanceDataRetrievalFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerformanceDataRetrievalFailureError';
  }
}

describe('SCEN-049: PerformanceDataRetrievalFailureError when WMS/HandyTerminal data retrieval fails with no cache fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PerformanceDataRetrievalFailureError when data retrieval times out and cache is unavailable', async () => {
    const input = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'picker',
      assignedSiteId: 'S100',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2025-01-15',
      executingUserId: 'admin001',
      historicalDataLookbackDays: 90,
    };

    const mockAiClient = {
      callAiService: jest.fn(),
    };

    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: 'admin001',
      authenticated: true,
    });

    jest.spyOn(authzModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
    });

    jest.spyOn(validationModule, 'validateInputData').mockResolvedValue({
      valid: true,
    });

    jest.spyOn(workerModule, 'findWorkersByClassificationAndSite').mockResolvedValue([
      'W002',
      'W003',
      'W004',
    ]);

    jest
      .spyOn(productivityModule, 'findProductivityDataByWorkerIds')
      .mockRejectedValue(
        new Error('Network timeout: WMS/HandyTerminal data retrieval failed'),
      );

    jest
      .spyOn(cacheModule, 'retrieveLatestValidCacheForPlacementGeneration')
      .mockResolvedValue(null);

    const saveInitialAssignmentSpy = jest
      .spyOn(persistenceModule, 'saveInitialAssignment')
      .mockResolvedValue('assignment-id');

    const sendNotificationSpy = jest
      .spyOn(notificationModule, 'sendNotification')
      .mockResolvedValue({ sent: true });

    let caughtError: any;
    let output: Tx5Imp1AgentOutput | undefined;
    try {
      output = await runTx5Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error;
    }

    // Check if error was thrown
    if (caughtError) {
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.name).toBe('PerformanceDataRetrievalFailureError');
      expect(caughtError.message).toBe(
        '過去実績データの取得に失敗しました。システム管理者に連絡してください。',
      );
    } else if (output) {
      // If error is returned as output instead of thrown
      expect(output.success).toBe(false);
      expect(output.initialAssignmentId).toBeNull();
      expect(output.errorDetails).toBe(
        '過去実績データの取得に失敗しました。システム管理者に連絡してください。',
      );
    } else {
      fail('Expected either error to be thrown or failed output to be returned');
    }

    expect(saveInitialAssignmentSpy).not.toHaveBeenCalled();
    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });

  it('should handle cache retrieval failure when data source also fails', async () => {
    const input = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'picker',
      assignedSiteId: 'S100',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2025-01-15',
      executingUserId: 'admin001',
      historicalDataLookbackDays: 90,
    };

    const mockAiClient = {
      callAiService: jest.fn(),
    };

    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: 'admin001',
      authenticated: true,
    });

    jest.spyOn(authzModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
    });

    jest.spyOn(validationModule, 'validateInputData').mockResolvedValue({
      valid: true,
    });

    jest.spyOn(workerModule, 'findWorkersByClassificationAndSite').mockResolvedValue([
      'W002',
      'W003',
      'W004',
    ]);

    const retrievalError = new Error('Connection refused: WMS unavailable');
    jest
      .spyOn(productivityModule, 'findProductivityDataByWorkerIds')
      .mockRejectedValue(retrievalError);

    jest
      .spyOn(cacheModule, 'retrieveLatestValidCacheForPlacementGeneration')
      .mockResolvedValue(null);

    const saveInitialAssignmentSpy = jest
      .spyOn(persistenceModule, 'saveInitialAssignment')
      .mockResolvedValue('assignment-id');

    const sendNotificationSpy = jest
      .spyOn(notificationModule, 'sendNotification')
      .mockResolvedValue({ sent: true });

    let caughtError: any;
    let output: Tx5Imp1AgentOutput | undefined;
    try {
      output = await runTx5Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error;
    }

    if (caughtError) {
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.name).toBe('PerformanceDataRetrievalFailureError');
      expect(caughtError.message).toBe(
        '過去実績データの取得に失敗しました。システム管理者に連絡してください。',
      );
    } else if (output) {
      expect(output.success).toBe(false);
      expect(output.initialAssignmentId).toBeNull();
      expect(output.errorDetails).toBe(
        '過去実績データの取得に失敗しました。システム管理者に連絡してください。',
      );
    } else {
      fail('Expected either error to be thrown or failed output to be returned');
    }

    expect(saveInitialAssignmentSpy).not.toHaveBeenCalled();
    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });

  it('should return failed output with proper error details when data retrieval and cache both fail', async () => {
    const input = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'picker',
      assignedSiteId: 'S100',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2025-01-15',
      executingUserId: 'admin001',
      historicalDataLookbackDays: 90,
    };

    const mockAiClient = {
      callAiService: jest.fn(),
    };

    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: 'admin001',
      authenticated: true,
    });

    jest.spyOn(authzModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
    });

    jest.spyOn(validationModule, 'validateInputData').mockResolvedValue({
      valid: true,
    });

    jest.spyOn(workerModule, 'findWorkersByClassificationAndSite').mockResolvedValue([
      'W002',
      'W003',
    ]);

    jest
      .spyOn(productivityModule, 'findProductivityDataByWorkerIds')
      .mockRejectedValue(new Error('Timeout'));

    jest
      .spyOn(cacheModule, 'retrieveLatestValidCacheForPlacementGeneration')
      .mockResolvedValue(null);

    const saveInitialAssignmentSpy = jest
      .spyOn(persistenceModule, 'saveInitialAssignment')
      .mockResolvedValue('assignment-id');

    const sendNotificationSpy = jest
      .spyOn(notificationModule, 'sendNotification')
      .mockResolvedValue({ sent: true });

    let caughtError: any;
    let output: Tx5Imp1AgentOutput | undefined;
    try {
      output = await runTx5Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error;
    }

    if (caughtError) {
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.name).toBe('PerformanceDataRetrievalFailureError');
      expect(caughtError.message).toBe(
        '過去実績データの取得に失敗しました。システム管理者に連絡してください。',
      );
    } else if (output) {
      expect(output.success).toBe(false);
      expect(output.initialAssignmentId).toBeNull();
      expect(output.errorDetails).toBe(
        '過去実績データの取得に失敗しました。システム管理者に連絡してください。',
      );
    } else {
      fail('Expected either error to be thrown or failed output to be returned');
    }

    expect(saveInitialAssignmentSpy).not.toHaveBeenCalled();
    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });

  it('should ensure error is identifiable from error name and message', async () => {
    const input = {
      newAssigneeWorkerId: 'W001',
      jobClassification: 'picker',
      assignedSiteId: 'S100',
      assignedTeamId: 'T001',
      assignedDepartmentId: 'D001',
      assignmentStartDate: '2025-01-15',
      executingUserId: 'admin001',
      historicalDataLookbackDays: 90,
    };

    const mockAiClient = {
      callAiService: jest.fn(),
    };

    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: 'admin001',
      authenticated: true,
    });

    jest.spyOn(authzModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
    });

    jest.spyOn(validationModule, 'validateInputData').mockResolvedValue({
      valid: true,
    });

    jest.spyOn(workerModule, 'findWorkersByClassificationAndSite').mockResolvedValue([
      'W002',
      'W003',
      'W004',
    ]);

    jest
      .spyOn(productivityModule, 'findProductivityDataByWorkerIds')
      .mockRejectedValue(new Error('WMS/HandyTerminal timeout'));

    jest
      .spyOn(cacheModule, 'retrieveLatestValidCacheForPlacementGeneration')
      .mockResolvedValue(null);

    const saveInitialAssignmentSpy = jest
      .spyOn(persistenceModule, 'saveInitialAssignment')
      .mockResolvedValue('assignment-id');

    const sendNotificationSpy = jest
      .spyOn(notificationModule, 'sendNotification')
      .mockResolvedValue({ sent: true });

    let caughtError: any;
    let output: Tx5Imp1AgentOutput | undefined;
    try {
      output = await runTx5Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error;
    }

    if (caughtError) {
      expect(caughtError).toBeDefined();
      const isIdentifiable =
        caughtError.name === 'PerformanceDataRetrievalFailureError' &&
        caughtError.message === '過去実績データの取得に失敗しました。システム管理者に連絡してください。';
      expect(isIdentifiable).toBe(true);
    } else if (output) {
      expect(output.success).toBe(false);
      expect(output.initialAssignmentId).toBeNull();
      expect(output.errorDetails).toBe(
        '過去実績データの取得に失敗しました。システム管理者に連絡してください。',
      );
    } else {
      fail('Expected either error to be thrown or failed output to be returned');
    }

    expect(saveInitialAssignmentSpy).not.toHaveBeenCalled();
    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });
});