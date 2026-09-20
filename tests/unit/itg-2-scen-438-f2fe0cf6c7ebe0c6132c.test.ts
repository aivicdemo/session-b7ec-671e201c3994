import { findWorkerById, FindWorkerByIdInput } from '../../src/logic/persistence-layer';

describe('SCEN-438: 作業者IDが空文字列またはnullの場合、入力値エラーが発生する', () => {
  const validRequestingUserId = 'user-123';

  it('should raise InvalidWorkerId error when workerId is empty string', async () => {
    const input: FindWorkerByIdInput = {
      workerId: '',
      requestingUserId: validRequestingUserId,
    };

    const result = await findWorkerById(input);

    expect(result.found).toBe(false);
    expect(result).toHaveProperty('error');
    expect(result.error?.code).toBe('InvalidWorkerId');
    expect(result.error?.message).toBe('作業者IDは必須です。');
  });

  it('should raise InvalidWorkerId error when workerId is null', async () => {
    const input: FindWorkerByIdInput = {
      workerId: null as any,
      requestingUserId: validRequestingUserId,
    };

    const result = await findWorkerById(input);

    expect(result.found).toBe(false);
    expect(result).toHaveProperty('error');
    expect(result.error?.code).toBe('InvalidWorkerId');
    expect(result.error?.message).toBe('作業者IDは必須です。');
  });

  it('should not return WorkerNotFound error for empty workerId', async () => {
    const input: FindWorkerByIdInput = {
      workerId: '',
      requestingUserId: validRequestingUserId,
    };

    const result = await findWorkerById(input);

    expect(result.found).toBe(false);
    expect(result.error?.code).not.toBe('WorkerNotFound');
    expect(result.error?.code).toBe('InvalidWorkerId');
  });
});