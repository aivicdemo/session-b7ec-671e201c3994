import { getWorkResultById } from '../../src/logic/data-persistence';

describe('SCEN-716: getWorkResultById with null workResultId', () => {
  it('should throw InvalidWorkResultIdError when workResultId is null', async () => {
    const input = {
      workResultId: null as any,
    };

    await expect(getWorkResultById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkResultIdError',
        message: 'Work result ID must not be empty.',
      })
    );
  });
});