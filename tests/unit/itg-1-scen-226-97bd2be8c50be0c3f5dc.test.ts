import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';
import * as authModule from '../../src/logic/auth-authorization-audit';
import * as dataSourceModule from '../../src/logic/data-source';
import * as aggregationModule from '../../src/logic/aggregation';
import * as persistenceModule from '../../src/logic/persistence';

jest.mock('../../src/logic/auth-authorization-audit');
jest.mock('../../src/logic/data-source');
jest.mock('../../src/logic/aggregation');
jest.mock('../../src/logic/persistence');

describe('SCEN-226: aggregateHandyTerminalWorkResults - Unauthorized Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccess error when operating user lacks facility access permission', async () => {
    const operatingUserId = 'USER-NOACCESS';
    const facilityId = 'F001';

    (authModule.authorizeOperation as jest.Mock).mockImplementation(() => {
      const error = new Error('User does not have permission to access the specified facility or team.');
      (error as any).name = 'UnauthorizedAccess';
      throw error;
    });

    const input = {
      facilityId,
      teamId: null,
      aggregationStartDateTime: '2025-01-01T00:00:00Z',
      aggregationEndDateTime: '2025-01-02T00:00:00Z',
      operatingUserId,
      includeWmsData: true,
    };

    await expect(aggregateHandyTerminalWorkResults(input)).rejects.toThrow('User does not have permission to access the specified facility or team.');

    expect(authModule.authorizeOperation).toHaveBeenCalled();
    expect(dataSourceModule.listHandyTerminalSyncLogByCondition).not.toHaveBeenCalled();
    expect(aggregationModule.aggregateWorkResultsAndCalculateProductivity).not.toHaveBeenCalled();
    expect(persistenceModule.persistProductivityData).not.toHaveBeenCalled();
  });
});