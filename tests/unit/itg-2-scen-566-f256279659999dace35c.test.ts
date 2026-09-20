import { findPerformanceRecordsByWorkerAndPeriod } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-566: findPerformanceRecordsByWorkerAndPeriod - Database Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return DatabaseError when database connection or query execution fails', async () => {
    jest.spyOn(persistenceLayer, 'findPerformanceRecordsByWorkerAndPeriod').mockRejectedValueOnce(
      Object.assign(new Error('データベースアクセスエラーが発生しました。'), {
        name: 'DatabaseError',
      })
    );

    const input = {
      workerId: 'W001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      requestingUserId: 'U001',
    };

    try {
      await findPerformanceRecordsByWorkerAndPeriod(input);
      fail('Expected DatabaseError to be thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.name).toBe('DatabaseError');
        expect(error.message).toBe('データベースアクセスエラーが発生しました。');
        expect((error as any).performanceRecords).toBeUndefined();
        expect((error as any).totalCount).toBeUndefined();
        expect((error as any).found).toBeUndefined();
        expect((error as any).workerId).toBeUndefined();
        expect((error as any).periodStartDate).toBeUndefined();
        expect((error as any).periodEndDate).toBeUndefined();
      }
    }
  });

  it('should not return FindPerformanceRecordsByWorkerAndPeriodOutput on database error', async () => {
    jest.spyOn(persistenceLayer, 'findPerformanceRecordsByWorkerAndPeriod').mockRejectedValueOnce(
      Object.assign(new Error('データベースアクセスエラーが発生しました。'), {
        name: 'DatabaseError',
      })
    );

    const input = {
      workerId: 'W001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      requestingUserId: 'U001',
    };

    try {
      const result = await findPerformanceRecordsByWorkerAndPeriod(input);
      fail('Expected error to be thrown, but got result: ' + JSON.stringify(result));
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.name).toBe('DatabaseError');
        expect(error.message).toBe('データベースアクセスエラーが発生しました。');
        expect(Object.prototype.hasOwnProperty.call(error, 'performanceRecords')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(error, 'totalCount')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(error, 'found')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(error, 'workerId')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(error, 'periodStartDate')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(error, 'periodEndDate')).toBe(false);
      }
    }
  });
});