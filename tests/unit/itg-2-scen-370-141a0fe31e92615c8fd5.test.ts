import { renderProductivityDashboard } from '../../src/logic/productivity-dashboard-presentation';
import * as productivityModule from '../../src/logic/productivity-dashboard-presentation';

describe('SCEN-370: InvalidFilterParameterError when filter values are invalid', () => {
  let authorizeUserActionSpy: jest.SpyInstance;
  let findWorkerByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    authorizeUserActionSpy = jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    findWorkerByIdSpy = jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      jobTitle: 'Operator',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw InvalidFilterParameterError when collectionPeriodStartDate is in invalid ISO 8601 format', async () => {
    const input = {
      workerId: 'W001',
      userId: 'U001',
      collectionPeriodStartDate: '2024-13-45',
      collectionPeriodEndDate: '2024-01-31',
      workTypeFilter: [],
    };

    try {
      await renderProductivityDashboard(input);
      fail('Expected InvalidFilterParameterError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InvalidFilterParameterError');
      expect(error.message).toBe('フィルター条件が無効です。');
    }
  });
});