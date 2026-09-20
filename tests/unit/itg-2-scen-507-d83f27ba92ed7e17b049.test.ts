import { findPlacementPlansByTeamAndDate } from '../../src/logic/persistence-layer';

describe('SCEN-507: findPlacementPlansByTeamAndDate - TeamNotFoundError when team does not exist or user lacks access', () => {
  it('should throw TeamNotFoundError when requesting user does not have access to the specified team', async () => {
    const nonExistentTeamId = 'NON_EXISTENT_TEAM_001';
    const targetDate = new Date();
    const userWithoutAccess = 'user_without_access';

    let errorThrown: Error | null = null;
    let result: any = null;

    try {
      result = await findPlacementPlansByTeamAndDate({
        teamId: nonExistentTeamId,
        targetDate: targetDate,
        requestingUserId: userWithoutAccess,
      });
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.name).toBe('TeamNotFoundError');
    expect(errorThrown?.message).toBe('チームが見つかりません。チームIDを確認してください。');
    expect(result).toBeNull();
  });
});