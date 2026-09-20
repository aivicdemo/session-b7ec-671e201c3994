import { getWorkerById } from '../../src/logic/data-persistence';

describe('SCEN-596: getWorkerById - 作業者IDがnullのとき、InvalidWorkerIdFormatErrorを発生させる', () => {
  it('should throw InvalidWorkerIdFormatError when workerId is null', async () => {
    const input = {
      workerId: null as any,
    };

    await expect(getWorkerById(input)).rejects.toThrow(Error);
    
    try {
      await getWorkerById(input);
      fail('Expected InvalidWorkerIdFormatError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InvalidWorkerIdFormatError');
      expect(error.message).toBe('作業者IDは空でない文字列である必要があります。');
    }
  });
});