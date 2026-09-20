import { getWorkInstructionById, GetWorkInstructionByIdInput, GetWorkInstructionByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-683: 有効な作業指示IDで検索すると、対応する作業指示データが正常に返される', () => {
  it('should return work instruction data when valid work instruction ID is provided', async () => {
    // Arrange: テスト用の有効な作業指示IDを設定
    const validWorkInstructionId = 'WI-20250115-001';
    const input: GetWorkInstructionByIdInput = {
      workInstructionId: validWorkInstructionId,
    };

    // Act: getWorkInstructionById を呼び出す
    const result = await getWorkInstructionById(input);

    // Assert: 戻り値が null ではなく、有効なオブジェクトが返されたことを確認
    expect(result).not.toBeNull();
    
    // 返却されたデータが入力した作業指示IDに対応していることを確認
    expect(result).toBeDefined();
    expect(result?.workInstructionId).toBe(validWorkInstructionId);
    
    // 返却されたデータが作業指示の詳細情報を含む有効なオブジェクトであることを確認
    expect(result?.facilityId).toBeDefined();
    expect(result?.teamId).toBeDefined();
    expect(result?.workInstructionNumber).toBeDefined();
    expect(result?.workName).toBeDefined();
    expect(result?.plannedStartDateTime).toBeDefined();
    expect(result?.plannedEndDateTime).toBeDefined();
    expect(result?.progressStatus).toBeDefined();
    expect(result?.requiredWorkerCount).toBeDefined();
    expect(result?.priority).toBeDefined();
    expect(result?.createdAt).toBeDefined();
    expect(result?.updatedAt).toBeDefined();
    expect(result?.createdBy).toBeDefined();

    // 進捗状況と割当人員情報が含まれていることを確認
    expect(typeof result?.progressStatus).toBe('string');
    expect(typeof result?.requiredWorkerCount).toBe('number');
    expect(result?.requiredWorkerCount).toBeGreaterThanOrEqual(0);
  });

  it('should return null when work instruction ID does not exist', async () => {
    // Arrange: 存在しない作業指示IDを設定
    const nonExistentWorkInstructionId = 'WI-NONEXISTENT-999';
    const input: GetWorkInstructionByIdInput = {
      workInstructionId: nonExistentWorkInstructionId,
    };

    // Act: getWorkInstructionById を呼び出す
    const result = await getWorkInstructionById(input);

    // Assert: 戻り値が null であることを確認
    expect(result).toBeNull();
  });

  it('should return work instruction with facility and team information', async () => {
    // Arrange: テスト用の有効な作業指示IDを設定
    const validWorkInstructionId = 'WI-20250115-001';
    const input: GetWorkInstructionByIdInput = {
      workInstructionId: validWorkInstructionId,
    };

    // Act: getWorkInstructionById を呼び出す
    const result = await getWorkInstructionById(input);

    // Assert: 拠点IDとチームIDが正しく返されることを確認
    expect(result).not.toBeNull();
    expect(result?.facilityId).toBeDefined();
    expect(typeof result?.facilityId).toBe('string');
    expect(result?.facilityId).toMatch(/^[a-zA-Z0-9-]+$/);
    
    expect(result?.teamId).toBeDefined();
    expect(typeof result?.teamId).toBe('string');
    expect(result?.teamId).toMatch(/^[a-zA-Z0-9-]+$/);
  });

  it('should return work instruction with progress details', async () => {
    // Arrange: テスト用の有効な作業指示IDを設定
    const validWorkInstructionId = 'WI-20250115-001';
    const input: GetWorkInstructionByIdInput = {
      workInstructionId: validWorkInstructionId,
    };

    // Act: getWorkInstructionById を呼び出す
    const result = await getWorkInstructionById(input);

    // Assert: 進捗ステータスが有効な値であることを確認
    expect(result).not.toBeNull();
    expect(['未開始', '進行中', '完了', '中止']).toContain(result?.progressStatus);
    
    // 進捗率が有効な範囲であることを確認（指定されている場合）
    if (result?.progressRate !== undefined) {
      expect(result.progressRate).toBeGreaterThanOrEqual(0);
      expect(result.progressRate).toBeLessThanOrEqual(100);
    }
  });

  it('should return work instruction with ISO 8601 formatted timestamps', async () => {
    // Arrange: テスト用の有効な作業指示IDを設定
    const validWorkInstructionId = 'WI-20250115-001';
    const input: GetWorkInstructionByIdInput = {
      workInstructionId: validWorkInstructionId,
    };

    // Act: getWorkInstructionById を呼び出す
    const result = await getWorkInstructionById(input);

    // Assert: タイムスタンプが ISO 8601 形式であることを確認
    expect(result).not.toBeNull();
    expect(result?.plannedStartDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result?.plannedEndDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    // 実績日時が指定されている場合は ISO 8601 形式であることを確認
    if (result?.actualStartDateTime) {
      expect(result.actualStartDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
    if (result?.actualEndDateTime) {
      expect(result.actualEndDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });
});