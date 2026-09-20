import { listWorkersByCondition } from '../../src/logic/data-persistence';
import { ListWorkersByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-617: listWorkersByCondition - InvalidCapacityRangeError when minMaxWorkingHours > maxMaxWorkingHours', () => {
  it('should throw InvalidCapacityRangeError when minMaxWorkingHours is greater than maxMaxWorkingHours', async () => {
    const input: ListWorkersByConditionInput = {
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workerNameKeyword: null,
      jobTypes: null,
      operatingStatuses: null,
      minHourlyRate: null,
      maxHourlyRate: null,
      minMaxWorkingHours: 100,
      maxMaxWorkingHours: 50,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    let errorThrown = false;
    let errorMessage = '';
    let errorName = '';

    try {
      await listWorkersByCondition(input);
    } catch (error) {
      errorThrown = true;
      if (error instanceof Error) {
        errorName = error.name;
        errorMessage = error.message;
      }
    }

    expect(errorThrown).toBe(true);
    expect(errorName).toBe('InvalidCapacityRangeError');
    expect(errorMessage).toBe('容量範囲が不正です。最小値は最大値以下である必要があります。');
  });
});