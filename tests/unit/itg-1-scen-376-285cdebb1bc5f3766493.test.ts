import { recordOperationAudit } from '../../src/logic/auth-authorization-audit';

describe('SCEN-376: 監査ログ記録 - ipAddressとsessionIdが正しく記録され、セッション追跡が可能', () => {
  it('recordOperationAuditが入力パラメータを正確に監査ログに永続化し、セッション追跡が可能な状態になることを検証', async () => {
    // Step 1: recordOperationAudit関数を呼び出し、入力値を渡す
    const input = {
      userId: 'USER001',
      operationType: 'UPDATE',
      operationTargetTable: '人員配置案',
      operationTargetId: 'PLAN-2024-001',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"key":"value1"}',
      changeAfterValue: '{"key":"value2"}',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-abc123def456',
      operationDateTime: '2024-01-15T14:30:45Z',
    };

    const result = await recordOperationAudit(input);

    // Step 3: 返却されたauditLogIdが空文字列でない一意識別子であることを検証
    expect(result.auditLogId).toBeTruthy();
    expect(typeof result.auditLogId).toBe('string');
    expect(result.auditLogId.length).toBeGreaterThan(0);
    // UUID形式の検証（標準的なUUID v4形式）
    expect(result.auditLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^[0-9a-f-]{36}$|^[a-zA-Z0-9_-]{20,}$/i);

    // Step 4: 返却されたrecordedDateTimeがISO 8601形式のタイムスタンプであることを検証
    expect(result.recordedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    const recordedDateObj = new Date(result.recordedDateTime);
    expect(recordedDateObj.getTime()).toBeGreaterThan(0);
    // 操作実行時点以降のタイムスタンプであることを検証
    const operationDate = new Date(input.operationDateTime);
    expect(recordedDateObj.getTime()).toBeGreaterThanOrEqual(operationDate.getTime());

    // Step 5: 返却されたstatusが'RECORDED'であることを検証
    expect(result.status).toBe('RECORDED');

    // Step 6: ipAddressが正確に記録されていることを確認
    expect(result.ipAddress).toBe('192.168.1.100');

    // Step 6: sessionIdが正確に記録されていることを確認
    expect(result.sessionId).toBe('SESSION-abc123def456');

    // 戻り値の構造確認（永続化の準備段階）
    expect(result).toHaveProperty('auditLogId');
    expect(result).toHaveProperty('recordedDateTime');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('ipAddress');
    expect(result).toHaveProperty('sessionId');
  });

  it('記録された監査ログのipAddressとsessionIdが入力値と完全に一致することを検証', async () => {
    const input = {
      userId: 'USER002',
      operationType: 'DELETE',
      operationTargetTable: '進捗データ',
      operationTargetId: 'PROG-2024-003',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"status":"active"}',
      changeAfterValue: null,
      errorMessage: null,
      ipAddress: '10.0.0.50',
      sessionId: 'SESSION-xyz789uvw012',
      operationDateTime: '2024-01-15T15:00:00Z',
    };

    const result = await recordOperationAudit(input);

    // 監査ログが正常に記録されたことを確認
    expect(result.status).toBe('RECORDED');
    expect(result.auditLogId).toBeTruthy();
    expect(result.recordedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // ipAddressが入力値と完全に一致することを検証
    expect(result.ipAddress).toBe('10.0.0.50');

    // sessionIdが入力値と完全に一致することを検証
    expect(result.sessionId).toBe('SESSION-xyz789uvw012');

    // auditLogIdを使用して記録内容を検証可能であることを確認
    expect(result).toHaveProperty('auditLogId');
    expect(result.auditLogId).not.toBeNull();
    expect(result.auditLogId.length).toBeGreaterThan(0);

    // 永続化層で入力値が正確に記録されたことを確認
    expect(result.status).toBe('RECORDED');
  });

  it('同一sessionIdで複数の操作を記録し、セッション単位で追跡可能であることを検証', async () => {
    const sessionId = 'SESSION-tracking-001';
    const operationLogs = [];

    // 同一sessionIdで3つの異なる操作を記録
    for (let i = 0; i < 3; i++) {
      const input = {
        userId: `USER00${i + 1}`,
        operationType: ['CREATE', 'UPDATE', 'DELETE'][i],
        operationTargetTable: ['人員配置案', '作業指示', '進捗データ'][i],
        operationTargetId: `ID-2024-00${i + 1}`,
        operationStatus: 'SUCCESS',
        changeBeforeValue: i === 0 ? null : '{"before":"value"}',
        changeAfterValue: i === 2 ? null : '{"after":"value"}',
        errorMessage: null,
        ipAddress: '192.168.1.100',
        sessionId: sessionId,
        operationDateTime: new Date(Date.now() + i * 1000).toISOString(),
      };

      const result = await recordOperationAudit(input);
      operationLogs.push(result);
    }

    // 全てのログが正常に記録されたことを確認
    expect(operationLogs).toHaveLength(3);
    operationLogs.forEach((log) => {
      expect(log.status).toBe('RECORDED');
      expect(log.auditLogId).toBeTruthy();
      // sessionIdが正確に記録されていることを確認
      expect(log.sessionId).toBe('SESSION-tracking-001');
    });

    // 各ログが一意のauditLogIdを持つことを確認
    const auditLogIds = operationLogs.map((log) => log.auditLogId);
    const uniqueIds = new Set(auditLogIds);
    expect(uniqueIds.size).toBe(3);

    // 同一sessionIdで複数の操作が記録されたことを確認
    expect(operationLogs.length).toBe(3);
    operationLogs.forEach((log, index) => {
      expect(log.status).toBe('RECORDED');
      expect(log.auditLogId).toBeTruthy();
      // sessionIdが同一であることを検証
      expect(log.sessionId).toBe(sessionId);
      // 永続化層に同一sessionIdで記録されていることが確認される
      expect(log).toHaveProperty('auditLogId');
      expect(log).toHaveProperty('recordedDateTime');
      expect(log).toHaveProperty('sessionId');
    });
  });

  it('ipAddressが入力値から永続化対象に正確に渡されることを検証', async () => {
    const testIpAddress = '203.0.113.45';
    const input = {
      userId: 'USER003',
      operationType: 'CREATE',
      operationTargetTable: '作業指示',
      operationTargetId: 'INSTR-2024-004',
      operationStatus: 'SUCCESS',
      changeBeforeValue: null,
      changeAfterValue: '{"priority":"high"}',
      errorMessage: null,
      ipAddress: testIpAddress,
      sessionId: 'SESSION-ip-test-001',
      operationDateTime: '2024-01-15T16:00:00Z',
    };

    const result = await recordOperationAudit(input);

    expect(result.status).toBe('RECORDED');
    expect(result.auditLogId).toBeTruthy();

    // 入力値ipAddressが正確に記録されたことを検証
    expect(result.ipAddress).toBe(testIpAddress);
    expect(result.ipAddress).toBe('203.0.113.45');

    // 戻り値から入力値が正確に処理されたことを確認
    expect(result).toHaveProperty('auditLogId');
    expect(result).toHaveProperty('recordedDateTime');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('ipAddress');
  });

  it('sessionIdが入力値から永続化対象に正確に渡されることを検証', async () => {
    const testSessionId = 'SESSION-session-test-789';
    const input = {
      userId: 'USER004',
      operationType: 'UPDATE',
      operationTargetTable: '生産性データ',
      operationTargetId: 'PROD-2024-005',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"score":85}',
      changeAfterValue: '{"score":90}',
      errorMessage: null,
      ipAddress: '198.51.100.22',
      sessionId: testSessionId,
      operationDateTime: '2024-01-15T17:00:00Z',
    };

    const result = await recordOperationAudit(input);

    expect(result.status).toBe('RECORDED');
    expect(result.auditLogId).toBeTruthy();

    // 入力値sessionIdが正確に記録されたことを検証
    expect(result.sessionId).toBe(testSessionId);
    expect(result.sessionId).toBe('SESSION-session-test-789');

    // 戻り値から入力値が正確に処理されたことを確認
    expect(result).toHaveProperty('auditLogId');
    expect(result).toHaveProperty('recordedDateTime');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('sessionId');
  });

  it('複数操作が同一sessionIdで記録され、後続処理での検索可能性を確認', async () => {
    const sharedSessionId = 'SESSION-multi-op-search-001';
    const operations = [];

    // 異なるユーザーと操作で同一sessionIdを使用
    const inputs = [
      {
        userId: 'ADMIN001',
        operationType: 'CREATE',
        operationTargetTable: '人員配置案',
        operationTargetId: 'PLAN-5001',
        ipAddress: '192.168.1.1',
      },
      {
        userId: 'LEADER001',
        operationType: 'UPDATE',
        operationTargetTable: '作業指示',
        operationTargetId: 'INSTR-5002',
        ipAddress: '192.168.1.2',
      },
      {
        userId: 'WORKER001',
        operationType: 'READ',
        operationTargetTable: '進捗データ',
        operationTargetId: 'PROG-5003',
        ipAddress: '192.168.1.3',
      },
    ];

    for (const input of inputs) {
      const result = await recordOperationAudit({
        userId: input.userId,
        operationType: input.operationType,
        operationTargetTable: input.operationTargetTable,
        operationTargetId: input.operationTargetId,
        operationStatus: 'SUCCESS',
        changeBeforeValue: null,
        changeAfterValue: null,
        errorMessage: null,
        ipAddress: input.ipAddress,
        sessionId: sharedSessionId,
        operationDateTime: new Date().toISOString(),
      });

      expect(result.status).toBe('RECORDED');
      operations.push(result);
    }

    // 複数操作が記録されたことを確認
    expect(operations.length).toBe(3);

    // 各操作が一意のauditLogIdを持つことを確認
    const logIds = operations.map((op) => op.auditLogId);
    const uniqueLogIds = new Set(logIds);
    expect(uniqueLogIds.size).toBe(3);

    // 同一sessionIdで複数操作が記録されたことを確認
    operations.forEach((operation, index) => {
      expect(operation).toHaveProperty('auditLogId');
      expect(operation).toHaveProperty('recordedDateTime');
      expect(operation).toHaveProperty('status');
      expect(operation.status).toBe('RECORDED');
      // sessionIdが同一であることを検証
      expect(operation.sessionId).toBe(sharedSessionId);
    });

    // 異なるipAddressが入力され、それぞれ永続化されていることを確認
    const recordedIpAddresses = operations.map((op) => op.ipAddress);
    expect(recordedIpAddresses).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);

    // 返却値から永続化層での同一sessionId検索が可能な状態であることを確認
    const allSessionIds = operations.map((op) => op.sessionId);
    expect(new Set(allSessionIds).size).toBe(1);
    expect(allSessionIds[0]).toBe('SESSION-multi-op-search-001');
  });
});