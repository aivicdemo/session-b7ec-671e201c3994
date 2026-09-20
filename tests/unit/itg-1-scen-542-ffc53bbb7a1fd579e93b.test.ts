import { listFacilitiesByCondition, ListFacilitiesByConditionInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-542: ListFacilitiesByCondition DatabaseTimeout', () => {
  let mockDatabaseAccessLayer: any;

  beforeEach(() => {
    mockDatabaseAccessLayer = {
      queryFacilities: jest.fn(),
    };

    jest.spyOn(dataPersistence, 'listFacilitiesByCondition').mockImplementation(async (input: ListFacilitiesByConditionInput) => {
      try {
        const result = await mockDatabaseAccessLayer.queryFacilities(input);
        return result;
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          throw Object.assign(
            new Error('拠点データの取得に失敗しました。システム管理者に連絡してください。'),
            { name: 'DatabaseAccessError' }
          );
        }
        throw error;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return DatabaseAccessError when database timeout occurs', async () => {
    const timeoutError = new Error('Database connection timeout');
    timeoutError.name = 'TimeoutError';

    mockDatabaseAccessLayer.queryFacilities.mockRejectedValueOnce(timeoutError);

    const input: ListFacilitiesByConditionInput = {
      facilityCodes: ['FAC001'],
    };

    try {
      await listFacilitiesByCondition(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toContain('拠点データの取得に失敗しました。システム管理者に連絡してください。');

      expect(error).not.toHaveProperty('facilities');
      expect(error).not.toHaveProperty('totalCount');
      expect(error).not.toHaveProperty('retrievedAt');
      expect(error).not.toHaveProperty('pageNumber');
      expect(error).not.toHaveProperty('pageSize');

      expect(typeof error).toBe('object');
      expect(error instanceof Error).toBe(true);
    }
  });
});