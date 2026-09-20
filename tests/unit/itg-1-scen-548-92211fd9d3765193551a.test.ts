import { saveTeam, getFacilityById, getWorkerById } from '../../src/logic/data-persistence';

// モック化は getFacilityById と getWorkerById のみに限定
jest.mock('../../src/logic/data-persistence', () => {
  const actual = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actual,
    getFacilityById: jest.fn(),
    getWorkerById: jest.fn(),
  };
});

describe('SCEN-548: チーム新規作成時の定員人数バリデーション', () => {
  describe('定員人数が0以下のとき、定員人数正数エラーが発生する', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      (getFacilityById as jest.Mock).mockResolvedValue({
        facilityId: 'fac-001',
        facilityName: 'Test Facility',
        facilityCode: 'FAC001',
        address: 'Test Address',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: '稼働中',
        responsiblePersonName: 'Manager Name',
        contactInfo: '090-1234-5678',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-admin',
        updatedBy: null,
      });

      (getWorkerById as jest.Mock).mockResolvedValue({
        workerId: 'worker-001',
        workerName: 'Test Worker',
        facilityId: 'fac-001',
        teamId: null,
        jobType: 'Leader',
        operatingStatus: '稼働中',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-admin',
        updatedBy: null,
      });
    });

    it('capacity=0の場合、InvalidCapacityErrorが発生すること', async () => {
      const input = {
        teamId: null,
        teamName: 'Test Team',
        facilityId: 'fac-001',
        teamLeaderId: 'worker-001',
        teamDescription: undefined,
        operatingStatus: '稼働中',
        capacity: 0,
        createdBy: 'user-admin',
        updatedBy: undefined,
      };

      let thrownError: Error | undefined;
      let result: any = undefined;

      try {
        result = await saveTeam(input);
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError?.name).toBe('InvalidCapacityError');
      expect(thrownError?.message).toBe('定員人数は1以上である必要があります。');
      expect(result).toBeUndefined();
    });

    it('capacity=-1の場合、InvalidCapacityErrorが発生すること', async () => {
      const input = {
        teamId: null,
        teamName: 'Test Team',
        facilityId: 'fac-001',
        teamLeaderId: 'worker-001',
        teamDescription: undefined,
        operatingStatus: '稼働中',
        capacity: -1,
        createdBy: 'user-admin',
        updatedBy: undefined,
      };

      let thrownError: Error | undefined;
      let result: any = undefined;

      try {
        result = await saveTeam(input);
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError?.name).toBe('InvalidCapacityError');
      expect(thrownError?.message).toBe('定員人数は1以上である必要があります。');
      expect(result).toBeUndefined();
    });

    it('capacity=-100の場合、InvalidCapacityErrorが発生すること', async () => {
      const input = {
        teamId: null,
        teamName: 'Test Team',
        facilityId: 'fac-001',
        teamLeaderId: 'worker-001',
        teamDescription: undefined,
        operatingStatus: '稼働中',
        capacity: -100,
        createdBy: 'user-admin',
        updatedBy: undefined,
      };

      let thrownError: Error | undefined;
      let result: any = undefined;

      try {
        result = await saveTeam(input);
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError?.name).toBe('InvalidCapacityError');
      expect(thrownError?.message).toBe('定員人数は1以上である必要があります。');
      expect(result).toBeUndefined();
    });
  });
});