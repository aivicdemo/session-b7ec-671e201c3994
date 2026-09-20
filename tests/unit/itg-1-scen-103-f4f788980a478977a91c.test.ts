import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('monitorAndJudgeDelayRisk - Input Validation', () => {
  const validInput = {
    facilityIds: ['facility-1', 'facility-2'],
    teamIds: ['team-1'],
    workInstructionIds: ['work-1'],
    evaluationDateTime: '2024-01-15T10:30:00Z',
    userId: 'user-123',
  };

  test('should throw InvalidInputParameterError when facilityIds is empty array', async () => {
    const invalidInput = {
      ...validInput,
      facilityIds: [],
    };

    await expect(monitorAndJudgeDelayRisk(invalidInput)).rejects.toMatchObject({
      name: 'InvalidInputParameterError',
      message: '入力パラメータが不正です。',
    });
  });

  test('should throw InvalidInputParameterError when evaluationDateTime is empty string', async () => {
    const invalidInput = {
      ...validInput,
      evaluationDateTime: '',
    };

    await expect(monitorAndJudgeDelayRisk(invalidInput)).rejects.toMatchObject({
      name: 'InvalidInputParameterError',
      message: '入力パラメータが不正です。',
    });
  });

  test('should throw InvalidInputParameterError when userId is null', async () => {
    const invalidInput = {
      ...validInput,
      userId: null as any,
    };

    await expect(monitorAndJudgeDelayRisk(invalidInput)).rejects.toMatchObject({
      name: 'InvalidInputParameterError',
      message: '入力パラメータが不正です。',
    });
  });

  test('should throw InvalidInputParameterError when evaluationDateTime is invalid ISO 8601 format', async () => {
    const invalidInput = {
      ...validInput,
      evaluationDateTime: '2024-13-45T25:70:00Z',
    };

    await expect(monitorAndJudgeDelayRisk(invalidInput)).rejects.toMatchObject({
      name: 'InvalidInputParameterError',
      message: '入力パラメータが不正です。',
    });
  });

  test('should throw InvalidInputParameterError when facilityIds contains non-string type', async () => {
    const invalidInput = {
      ...validInput,
      facilityIds: ['facility-1', 123 as any],
    };

    await expect(monitorAndJudgeDelayRisk(invalidInput)).rejects.toMatchObject({
      name: 'InvalidInputParameterError',
      message: '入力パラメータが不正です。',
    });
  });

  test('should throw InvalidInputParameterError when userId is empty string', async () => {
    const invalidInput = {
      ...validInput,
      userId: '',
    };

    await expect(monitorAndJudgeDelayRisk(invalidInput)).rejects.toMatchObject({
      name: 'InvalidInputParameterError',
      message: '入力パラメータが不正です。',
    });
  });
});