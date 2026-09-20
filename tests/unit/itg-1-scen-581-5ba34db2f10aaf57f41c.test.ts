import { saveWorker, SaveWorkerInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-581: saveWorker - TeamNotFoundError when team does not belong to facility', () => {
  let getFacilityByIdSpy: jest.SpyInstance;
  let getTeamByIdSpy: jest.SpyInstance;
  let validateInputFormatSpy: jest.SpyInstance;

  beforeEach(() => {
    // Stub getFacilityById to return valid facility information
    getFacilityByIdSpy = jest.spyOn(dataPersistence, 'getFacilityById').mockResolvedValue({
      facilityId: 'FAC-001',
      facilityName: '東京拠点',
      facilityCode: 'TK001',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '田中太郎',
      contactInfo: '09012345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'USER-ADMIN',
      updatedBy: undefined,
    });

    // Stub getTeamById to return null when teamId does not belong to facilityId
    getTeamByIdSpy = jest.spyOn(dataPersistence, 'getTeamById').mockImplementation(
      async (input: any) => {
        // Verify that getTeamById is called with both teamId and facilityId
        if (input.teamId === 'TEAM-999' && input.facilityId === 'FAC-001') {
          // Return null to indicate team does not exist for this facility
          return null;
        }
        // Default: return null for unmatched combinations
        return null;
      }
    );

    // Stub validateInputFormat to return true, indicating input format is valid
    validateInputFormatSpy = jest.spyOn(dataPersistence, 'validateInputFormat').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw TeamNotFoundError when specified teamId does not belong to specified facilityId', async () => {
    // Prepare input: new worker creation with non-existent team for the facility
    const input: SaveWorkerInput = {
      workerId: null,
      workerName: '山田太郎',
      facilityId: 'FAC-001',
      teamId: 'TEAM-999',
      jobType: '仕分け作業者',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdBy: 'USER-123',
      updatedBy: undefined,
    };

    // Execute and verify error is thrown with correct type and message
    let errorThrown: Error | null = null;
    try {
      await saveWorker(input);
    } catch (err) {
      errorThrown = err as Error;
    }

    // Verify that TeamNotFoundError was thrown with correct message
    expect(errorThrown).toBeTruthy();
    expect(errorThrown?.constructor.name).toBe('TeamNotFoundError');
    expect(errorThrown?.message).toBe('指定されたチームが見つかりません。');

    // Verify that getFacilityById was called with correct facilityId
    expect(getFacilityByIdSpy).toHaveBeenCalledWith(expect.objectContaining({
      facilityId: 'FAC-001',
    }));

    // Verify that getTeamById was called with both teamId and facilityId combination
    expect(getTeamByIdSpy).toHaveBeenCalledWith(expect.objectContaining({
      teamId: 'TEAM-999',
      facilityId: 'FAC-001',
    }));

    // Verify that no SaveWorkerOutput is returned (error prevents persistence)
    // This is implicitly verified by the error being thrown, but we can also check
    // that the function did not return normally
    expect(errorThrown).not.toBeNull();
  });
});