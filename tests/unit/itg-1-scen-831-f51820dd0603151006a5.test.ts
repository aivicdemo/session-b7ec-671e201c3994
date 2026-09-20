import { getAllocationExecutionStatusById } from '../../src/logic/data-persistence';
import { GetAllocationExecutionStatusByIdInput, GetAllocationExecutionStatusByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-831: 人員配置実行状況データの取得と計画実績ギャップの提供', () => {
  it('指定された人員配置実行状況IDで有効なレコードが存在する場合、対応するデータと計画実績ギャップ・進捗率・遅延フラグを返す', async () => {
    // テスト対象の処理 getAllocationExecutionStatusById を呼び出す準備として、有効な人員配置実行状況IDを用意する
    const allocationExecutionStatusId = 'ALLOC-EXE-20250115-001';

    // getAllocationExecutionStatusById に入力型 GetAllocationExecutionStatusByIdInput を渡す
    const input: GetAllocationExecutionStatusByIdInput = {
      allocationExecutionStatusId: allocationExecutionStatusId,
    };

    // 処理が正常に完了し、出力型 GetAllocationExecutionStatusByIdOutput を返すことを確認する
    const result: GetAllocationExecutionStatusByIdOutput = await getAllocationExecutionStatusById(input);

    // 返却されたオブジェクトが null ではないことを確認する
    expect(result).not.toBeNull();
    expect(result).toBeDefined();

    // 返却されたオブジェクトが、データベースに存在する人員配置実行状況レコードに対応していることを確認する
    expect(result.allocationExecutionStatusId).toBe(allocationExecutionStatusId);
    expect(result.allocationPlanId).toBeDefined();
    expect(result.workInstructionId).toBeDefined();
    expect(result.workerId).toBeDefined();
    expect(result.facilityId).toBeDefined();
    expect(result.teamId).toBeDefined();
    expect(result.allocationState).toBeDefined();
    expect(result.plannedStartDateTime).toBeDefined();
    expect(result.plannedEndDateTime).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdBy).toBeDefined();

    // 返却されたオブジェクトが、計画と実績のギャップ、進捗率、遅延フラグを含むデータを保有していることを確認する
    expect(result.plannedWorkHours).toBeDefined();
    expect(typeof result.plannedWorkHours).toBe('number');

    expect(result.progressRate).toBeDefined();
    expect(typeof result.progressRate).toBe('number');
    expect(result.progressRate).toBeGreaterThanOrEqual(0);
    expect(result.progressRate).toBeLessThanOrEqual(100);

    expect(result.delayFlag).toBeDefined();
    expect(typeof result.delayFlag).toBe('boolean');

    // 実績データが存在する場合、ギャップを計算可能な状態であることを確認
    if (result.actualWorkHours !== null && result.actualWorkHours !== undefined) {
      const workHoursGap = result.plannedWorkHours - result.actualWorkHours;
      expect(typeof workHoursGap).toBe('number');
    }

    // 遅延フラグとプロパティの整合性を確認
    if (result.delayFlag === true) {
      expect(result.plannedEndDateTime).toBeDefined();
      if (result.actualEndDateTime !== null && result.actualEndDateTime !== undefined) {
        const plannedEnd = new Date(result.plannedEndDateTime).getTime();
        const actualEnd = new Date(result.actualEndDateTime).getTime();
        expect(actualEnd).toBeGreaterThan(plannedEnd);
      }
    }
  });
});