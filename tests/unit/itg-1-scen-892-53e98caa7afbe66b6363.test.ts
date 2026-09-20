import { saveProgressData } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-892: Progress date validation in saveProgressData', () => {
  let getWorkInstructionByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getWorkInstructionByIdSpy = jest.spyOn(dataPersistence, 'getWorkInstructionById' as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw InvalidProgressDate error when progressDate is before workInstruction plannedStartDateTime', async () => {
    // Arrange: Set up work instruction stub with plannedStartDateTime = '2024-01-15'
    const workInstructionId = 'WI-001';
    const facilityId = 'FAC-001';
    const teamId = 'TEAM-001';
    const plannedStartDateTime = '2024-01-15T00:00:00Z';
    const progressDate = '2024-01-14';

    // Mock the getWorkInstructionById to return a work instruction with planned start date
    (getWorkInstructionByIdSpy as jest.Mock).mockResolvedValue({
      workInstructionId,
      facilityId,
      teamId,
      workInstructionNumber: 'WI-001-NUM',
      workName: 'Test Work',
      plannedStartDateTime,
      plannedEndDateTime: '2024-01-20T00:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      progressStatus: 'pending',
      progressRate: 0,
      requiredWorkerCount: 5,
      priority: 'high',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USER-SYSTEM',
      updatedBy: null,
    });

    const input = {
      progressDataId: null as string | null | undefined,
      workInstructionId,
      facilityId,
      teamId,
      progressDate,
      plannedQuantity: 100,
      actualQuantity: 50,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: null,
      createdBy: 'USER-001',
      updatedBy: undefined,
    };

    // Act & Assert
    try {
      await saveProgressData(input);
      fail('Expected InvalidProgressDate error to be thrown');
    } catch (error: unknown) {
      // Assert: Verify error type and message
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('InvalidProgressDate');
      expect((error as Error).message).toBe('進捗日が作業指示の期間外です。');

      // Assert: Verify that no SaveProgressDataOutput was returned
      expect(error).toBeDefined();
    }

    // Assert: Verify that work instruction was retrieved for validation
    expect(getWorkInstructionByIdSpy).toHaveBeenCalledWith({
      workInstructionId,
    });
  });
});