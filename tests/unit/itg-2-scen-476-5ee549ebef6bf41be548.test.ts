import { findProductivityDataByTeamAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-476: チームIDがnullまたは空文字列のとき、InvalidTeamIdErrorが発生する', () => {
  test('teamIdがnullの場合、InvalidTeamIdErrorが発生する', async () => {
    const teamId = null as any;
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'valid-user-id';

    await expect(
      findProductivityDataByTeamAndPeriod({
        teamId,
        startDate,
        endDate,
        requestingUserId,
      })
    ).rejects.toMatchObject({
      name: 'InvalidTeamIdError',
      message: 'チームIDが指定されていません。',
    });
  });

  test('teamIdが空文字列の場合、InvalidTeamIdErrorが発生する', async () => {
    const teamId = '';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'valid-user-id';

    await expect(
      findProductivityDataByTeamAndPeriod({
        teamId,
        startDate,
        endDate,
        requestingUserId,
      })
    ).rejects.toMatchObject({
      name: 'InvalidTeamIdError',
      message: 'チームIDが指定されていません。',
    });
  });
});