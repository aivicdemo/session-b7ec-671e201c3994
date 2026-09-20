import { ListWorkInstructionsByConditionInput, ListWorkInstructionsByConditionOutput, GetWorkInstructionByIdOutput } from '../../src/logic/data-persistence';
import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-696: 作業名キーワード検索で部分一致により該当データが取得できる', () => {
  it('should retrieve work instructions with partial match on work name keyword', async () => {
    // テスト対象の関数を呼び出し
    const input: ListWorkInstructionsByConditionInput = {
      workNameKeyword: '部分',
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionNumbers: null,
      progressStatuses: null,
      priorities: null,
      minRequiredWorkerCount: null,
      maxRequiredWorkerCount: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listWorkInstructionsByCondition(input);

    // 検索結果の検証
    expect(result).toBeDefined();
    expect(result.totalCount).toBe(2);
    expect(result.workInstructions).toHaveLength(2);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toBeDefined();

    // retrievedAt が ISO 8601 形式であることを確認
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);

    // 1番目の作業指示の検証
    const workInstruction1 = result.workInstructions[0];
    expect(workInstruction1.workName).toBe('部分組立');
    expect(workInstruction1.workInstructionId).toBe('WI-001');
    expect(workInstruction1.progressStatus).toBe('進行中');
    expect(workInstruction1.progressRate).toBe(50);
    expect(workInstruction1.requiredWorkerCount).toBe(3);
    expect(workInstruction1.priority).toBe('中');

    // 2番目の作業指示の検証
    const workInstruction2 = result.workInstructions[1];
    expect(workInstruction2.workName).toBe('部分検査');
    expect(workInstruction2.workInstructionId).toBe('WI-002');
    expect(workInstruction2.progressStatus).toBe('未開始');
    expect(workInstruction2.progressRate).toBe(0);
    expect(workInstruction2.requiredWorkerCount).toBe(2);
    expect(workInstruction2.priority).toBe('高');

    // 両方の作業指示に必要な詳細情報が含まれていることを確認
    result.workInstructions.forEach((instruction) => {
      expect(instruction.workInstructionId).toBeDefined();
      expect(instruction.facilityId).toBeDefined();
      expect(instruction.teamId).toBeDefined();
      expect(instruction.workInstructionNumber).toBeDefined();
      expect(instruction.workName).toBeDefined();
      expect(instruction.plannedStartDateTime).toBeDefined();
      expect(instruction.plannedEndDateTime).toBeDefined();
      expect(instruction.progressStatus).toBeDefined();
      expect(instruction.requiredWorkerCount).toBeDefined();
      expect(instruction.priority).toBeDefined();
      expect(instruction.createdAt).toBeDefined();
      expect(instruction.updatedAt).toBeDefined();
      expect(instruction.createdBy).toBeDefined();
    });
  });
});