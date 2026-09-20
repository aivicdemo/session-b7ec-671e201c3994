import {
  listWorkersByCondition,
  ListWorkersByConditionInput,
} from '../../src/logic/data-persistence';

describe('SCEN-620: listWorkersByCondition - Invalid sortBy Field', () => {
  it('should throw InvalidSortParameterError when sortBy specifies a non-existent field', async () => {
    const input: ListWorkersByConditionInput = {
      workerIds: undefined,
      facilityIds: undefined,
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
      sortBy: 'nonExistentField',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(listWorkersByCondition(input)).rejects.toThrow(
      'ソート条件が不正です。指定されたフィールドまたはソート順序が無効です。'
    );
  });
});