import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import type { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput, GetAllocationExecutionStatusByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-867: 出力に進捗率が含まれる', () => {
  it('should return allocationExecutionStatuses with progressRate field for all records', async () => {
    // テスト対象の入力パラメータを準備する
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationStates: ['進行中'],
      pageNumber: 1,
      pageSize: 10,
    };

    // listAllocationExecutionStatusByConditionを上記の入力パラメータで呼び出す
    const output: ListAllocationExecutionStatusByConditionOutput = await listAllocationExecutionStatusByCondition(input);

    // 戻り値の出力型を取得する
    expect(output).toBeDefined();
    expect(output.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(output.allocationExecutionStatuses)).toBe(true);

    // 出力型のallocationExecutionStatusesフィールドのすべての要素において、progressRateフィールドがnull/undefinedではないことを確認する
    expect(output.allocationExecutionStatuses.length).toBeGreaterThan(0);

    // 出力型のallocationExecutionStatusesフィールドの各要素を走査し、progressRateフィールドが存在し、値が数値型（0～100の範囲）であることを確認する
    output.allocationExecutionStatuses.forEach((record: GetAllocationExecutionStatusByIdOutput) => {
      // progressRateフィールドが存在することを確認
      expect(record.progressRate).toBeDefined();
      
      // progressRateがnull/undefinedではないことを確認
      expect(record.progressRate).not.toBeNull();
      expect(record.progressRate).not.toBeUndefined();
      
      // progressRateが数値型であることを確認
      expect(typeof record.progressRate).toBe('number');
      
      // progressRateが0以上100以下の範囲内であることを確認
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);
    });

    // 返却されたすべての人員配置実行状況レコードにおいて、progressRateが計算済みの具体的な値で出力されていることを確認
    output.allocationExecutionStatuses.forEach((record: GetAllocationExecutionStatusByIdOutput) => {
      // 具体的な数値が存在すること（0などの値も許容）
      expect(Number.isInteger(record.progressRate) || !Number.isNaN(record.progressRate)).toBe(true);
    });
  });
});