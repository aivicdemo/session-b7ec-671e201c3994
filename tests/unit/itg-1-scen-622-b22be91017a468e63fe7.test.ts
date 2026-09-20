import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-622: listWorkersByCondition - Database Connection Failure', () => {
  it('should throw DataRetrievalError when database connection fails', async () => {
    const input = {
      workerIds: ['W001', 'W002'],
      facilityIds: ['F001'],
      teamIds: undefined,
      workerNameKeyword: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 10,
    };

    try {
      await listWorkersByCondition(input);
      fail('Expected DataRetrievalError to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('DataRetrievalError');
      expect(error.message).toContain('作業者データの取得に失敗しました');
    }
  });
});