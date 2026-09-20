import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('SCEN-412: チームIDが無効な形式である場合、チームID形式エラーが発生する', () => {
  it('無効な形式のチームIDを入力するとInvalidTeamIdErrorが発生し、適切なエラーメッセージが返される', () => {
    // Arrange
    const invalidTeamId = 'INVALID_TEAM_#123';

    // Act & Assert
    try {
      validateReferentialIntegrity({
        teamId: invalidTeamId,
        facilityId: undefined,
        workerId: undefined,
        workInstructionId: undefined,
        allocationPlanId: undefined,
        proficiencyId: undefined,
      });
      fail('InvalidTeamIdErrorが発生するはずです');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidTeamIdError');
      expect(error.message).toMatch(new RegExp(`チームID '${invalidTeamId}' の形式が不正です`));
      expect(error.message).toMatch(/期待される形式:/);
    }
  });
});