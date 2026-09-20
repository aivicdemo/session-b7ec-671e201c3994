import { getWorkResultById } from '../../src/logic/data-persistence';

describe('SCEN-717: 作業実績IDがundefinedの場合、InvalidWorkResultIdエラーを発生させる', () => {
  it('should throw InvalidWorkResultId error when workResultId is undefined', async () => {
    const input = {
      workResultId: undefined as any,
    };

    await expect(getWorkResultById(input)).rejects.toThrow('Work result ID must not be empty.');
  });
});