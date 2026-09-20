import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import * as progressMonitoring from '../../src/logic/progress-monitoring';

describe('SCEN-140: WMSから取得した進捗データが期待されるスキーマに合致しないとき、InvalidProgressDataFormatエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidProgressDataFormat error when WMS progress data has invalid schema', async () => {
    const input = {
      userId: 'user-001',
      siteIds: ['site-A'],
      teamIds: ['team-1'],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    // Mock validateInputData to pass input validation
    jest.spyOn(progressMonitoring, 'validateInputData' as any).mockResolvedValue(true);

    // Mock authorizeUserAction to pass authorization check
    jest.spyOn(progressMonitoring, 'authorizeUserAction' as any).mockResolvedValue(true);

    // Mock WMS data retrieval to return data with invalid schema
    // Return data where numeric fields are strings, array fields are objects, etc.
    // This data structure does not match the expected SiteProgressData type
    const invalidSchemaData = {
      siteId: 'site-A',
      siteName: 'Site A',
      currentProgressRate: '45', // Should be number, but string
      plannedProgressRate: 50,
      remainingDays: 10,
      totalWorkload: 'invalid', // Should be number, but string
      currentTeamCapacity: 5,
      affectedTeams: { team1: 'team-1' }, // Should be array, but object
      // Missing required field: could add more schema violations
    };

    jest.spyOn(progressMonitoring, 'aggregateProgressDataBySite' as any).mockResolvedValue([invalidSchemaData]);

    let thrownError: Error | undefined;
    let returnedOutput: any;

    try {
      returnedOutput = await monitorProgressAndDetectDelayRisk(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // Verify that InvalidProgressDataFormat error was thrown
    expect(thrownError).toBeDefined();
    expect(thrownError!.name).toBe('InvalidProgressDataFormat');
    expect(thrownError!.message).toBe('進捗データの形式が不正です。');

    // Verify that the function does not return the output type when error occurs
    expect(returnedOutput).toBeUndefined();

    // Verify that the error is properly propagated and not silently suppressed
    expect(thrownError).toBeInstanceOf(Error);
    expect(() => {
      throw thrownError;
    }).toThrow('進捗データの形式が不正です。');
  });
});