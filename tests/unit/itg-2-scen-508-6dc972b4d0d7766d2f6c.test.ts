import { findPlacementPlansByTeamAndDate } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-508: findPlacementPlansByTeamAndDate - Invalid targetDate handling', () => {
  beforeEach(() => {
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw InvalidDateRangeError when targetDate is null', async () => {
    const teamId = 'team-001';
    const targetDate = null as any;
    const requestingUserId = 'user-001';

    await expect(
      findPlacementPlansByTeamAndDate({
        teamId,
        targetDate,
        requestingUserId,
      })
    ).rejects.toThrow(expect.objectContaining({
      name: 'InvalidDateRangeError',
      message: '対象日付が無効です。有効な日付を指定してください。',
    }));
  });

  it('should throw InvalidDateRangeError when targetDate is invalid format', async () => {
    const teamId = 'team-001';
    const targetDate = 'invalid-date' as any;
    const requestingUserId = 'user-001';

    await expect(
      findPlacementPlansByTeamAndDate({
        teamId,
        targetDate,
        requestingUserId,
      })
    ).rejects.toThrow(expect.objectContaining({
      name: 'InvalidDateRangeError',
      message: '対象日付が無効です。有効な日付を指定してください。',
    }));
  });
});