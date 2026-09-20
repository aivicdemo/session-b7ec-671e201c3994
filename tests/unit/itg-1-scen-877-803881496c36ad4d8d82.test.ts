import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-877: listAllocationExecutionStatusByCondition - 存在しない作業指示IDでのエラー処理', () => {
  test('指定された作業指示IDが存在しない場合にReferentialIntegrityErrorを返す', async () => {
    const input = {
      workInstructionIds: ['non-existent-work-instruction-id-001'],
    };

    let thrownError: any;
    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('ReferentialIntegrityError should have been thrown');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('ReferentialIntegrityError');
    expect(thrownError.message).toBe('指定された拠点、チーム、作業指示、または作業者が見つかりません。');
  });
});