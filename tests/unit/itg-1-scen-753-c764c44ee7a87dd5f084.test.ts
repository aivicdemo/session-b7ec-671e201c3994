import * as dataPersistence from '../../src/logic/data-persistence';
import * as validationModule from '../../src/logic/validation';

jest.mock('../../src/logic/validation');

describe('SCEN-753: listWorkResultsByCondition delegates date and numeric range validation to external processes', () => {
  let validateDateTimeRangeMock: jest.Mock;
  let validateNumericQuantityMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    validateDateTimeRangeMock = validationModule.validateDateTimeRange as jest.Mock;
    validateNumericQuantityMock = validationModule.validateNumericQuantity as jest.Mock;
    validateDateTimeRangeMock.mockResolvedValue(undefined);
    validateNumericQuantityMock.mockResolvedValue(undefined);
  });

  it('should delegate all date and numeric range pairs to external validation functions with exact call matching', async () => {
    const input: dataPersistence.ListWorkResultsByConditionInput = {
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: 0,
      maxActualQuantity: 1000,
      minDefectCount: 0,
      maxDefectCount: 100,
      actualStartFromDateTime: '2024-01-01T09:00:00Z',
      actualStartToDateTime: '2024-01-31T18:00:00Z',
      actualEndFromDateTime: '2024-02-01T09:00:00Z',
      actualEndToDateTime: '2024-02-15T18:00:00Z',
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-01-31T23:59:59Z',
      updatedFromDate: '2024-01-15T00:00:00Z',
      updatedToDate: '2024-01-20T23:59:59Z',
      sortBy: undefined,
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await dataPersistence.listWorkResultsByCondition(input);

    // Verify all date time range validations were delegated
    expect(validateDateTimeRangeMock).toHaveBeenCalledTimes(4);
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(1, '2024-01-01T09:00:00Z', '2024-01-31T18:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(2, '2024-02-01T09:00:00Z', '2024-02-15T18:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(3, '2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(4, '2024-01-15T00:00:00Z', '2024-01-20T23:59:59Z');

    // Verify all numeric quantity validations were delegated
    expect(validateNumericQuantityMock).toHaveBeenCalledTimes(2);
    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(1, 0, 1000);
    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(2, 0, 100);

    // Verify function executed and returned expected structure
    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should call external validators for all range pairs in correct order and complete execution', async () => {
    const input: dataPersistence.ListWorkResultsByConditionInput = {
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: 100,
      maxActualQuantity: 50,
      minDefectCount: 20,
      maxDefectCount: 10,
      actualStartFromDateTime: '2024-01-31T18:00:00Z',
      actualStartToDateTime: '2024-01-01T09:00:00Z',
      actualEndFromDateTime: '2024-02-15T18:00:00Z',
      actualEndToDateTime: '2024-02-01T09:00:00Z',
      createdFromDate: '2024-01-31T23:59:59Z',
      createdToDate: '2024-01-01T00:00:00Z',
      updatedFromDate: '2024-01-20T23:59:59Z',
      updatedToDate: '2024-01-15T00:00:00Z',
      sortBy: undefined,
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await dataPersistence.listWorkResultsByCondition(input);

    // Verify validators were called exactly for each pair
    expect(validateDateTimeRangeMock).toHaveBeenCalledTimes(4);
    expect(validateNumericQuantityMock).toHaveBeenCalledTimes(2);

    // Verify validation delegation includes inverted ranges (which are validated by external functions)
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(1, '2024-01-31T18:00:00Z', '2024-01-01T09:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(2, '2024-02-15T18:00:00Z', '2024-02-01T09:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(3, '2024-01-31T23:59:59Z', '2024-01-01T00:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(4, '2024-01-20T23:59:59Z', '2024-01-15T00:00:00Z');

    // Verify numeric quantity validations with inverted ranges delegated to external function
    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(1, 100, 50);
    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(2, 20, 10);

    // Verify execution completed
    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should delegate validation responsibility completely to external functions without internal range checking', async () => {
    const input: dataPersistence.ListWorkResultsByConditionInput = {
      workResultIds: ['wi-1'],
      workInstructionIds: ['instr-1'],
      workerIds: ['w-1'],
      facilityIds: ['f-1'],
      teamIds: ['t-1'],
      workStatuses: ['completed'],
      minActualQuantity: 5,
      maxActualQuantity: 10,
      minDefectCount: 1,
      maxDefectCount: 3,
      actualStartFromDateTime: '2024-01-15T10:00:00Z',
      actualStartToDateTime: '2024-01-20T15:00:00Z',
      actualEndFromDateTime: '2024-01-16T10:00:00Z',
      actualEndToDateTime: '2024-01-21T15:00:00Z',
      createdFromDate: '2024-01-10T00:00:00Z',
      createdToDate: '2024-01-25T23:59:59Z',
      updatedFromDate: '2024-01-12T00:00:00Z',
      updatedToDate: '2024-01-22T23:59:59Z',
      sortBy: 'actualStartDateTime',
      sortOrder: 'DESC',
      pageNumber: 2,
      pageSize: 25,
    };

    const result = await dataPersistence.listWorkResultsByCondition(input);

    // Verify all range pairs were delegated to external validators
    expect(validateDateTimeRangeMock).toHaveBeenCalledTimes(4);
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(1, '2024-01-15T10:00:00Z', '2024-01-20T15:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(2, '2024-01-16T10:00:00Z', '2024-01-21T15:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(3, '2024-01-10T00:00:00Z', '2024-01-25T23:59:59Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(4, '2024-01-12T00:00:00Z', '2024-01-22T23:59:59Z');

    // Verify numeric quantity validations were delegated
    expect(validateNumericQuantityMock).toHaveBeenCalledTimes(2);
    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(1, 5, 10);
    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(2, 1, 3);

    // Verify function executed successfully
    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should delegate validation before processing and not perform internal range checks', async () => {
    const input: dataPersistence.ListWorkResultsByConditionInput = {
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: 10,
      maxActualQuantity: 5,
      minDefectCount: 50,
      maxDefectCount: 25,
      actualStartFromDateTime: '2024-01-20T10:00:00Z',
      actualStartToDateTime: '2024-01-10T10:00:00Z',
      actualEndFromDateTime: '2024-02-10T10:00:00Z',
      actualEndToDateTime: '2024-02-01T10:00:00Z',
      createdFromDate: '2024-01-20T10:00:00Z',
      createdToDate: '2024-01-10T10:00:00Z',
      updatedFromDate: '2024-01-18T10:00:00Z',
      updatedToDate: '2024-01-12T10:00:00Z',
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await dataPersistence.listWorkResultsByCondition(input);

    // Verify all validators were called exactly once for each pair
    expect(validateDateTimeRangeMock).toHaveBeenCalledTimes(4);
    expect(validateNumericQuantityMock).toHaveBeenCalledTimes(2);

    // Verify validation delegation occurred for all ranges without internal checks
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(1, '2024-01-20T10:00:00Z', '2024-01-10T10:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(2, '2024-02-10T10:00:00Z', '2024-02-01T10:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(3, '2024-01-20T10:00:00Z', '2024-01-10T10:00:00Z');
    expect(validateDateTimeRangeMock).toHaveBeenNthCalledWith(4, '2024-01-18T10:00:00Z', '2024-01-12T10:00:00Z');

    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(1, 10, 5);
    expect(validateNumericQuantityMock).toHaveBeenNthCalledWith(2, 50, 25);

    // Verify result is defined, confirming no internal validation rejected the call
    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });
});