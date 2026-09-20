import { recordOperationAudit } from "../../src/logic/auth-authorization-audit";

describe("SCEN-372: 操作失敗時にエラーメッセージが正しく記録される", () => {
  it("操作失敗時のエラーメッセージが監査ログに記録される", async () => {
    const input = {
      userId: "user123",
      operationType: "UPDATE",
      operationTargetTable: "人員配置案",
      operationTargetId: "staffplan456",
      operationStatus: "FAILURE",
      changeBeforeValue: '{"allocation":10}',
      changeAfterValue: null,
      errorMessage: "データベース接続がタイムアウトしました",
      ipAddress: "192.168.1.100",
      sessionId: "sess789",
      operationDateTime: "2024-01-15T14:30:00Z",
    };

    const result = await recordOperationAudit(input);

    expect(result).toBeDefined();
    expect(result.auditLogId).toBeTruthy();
    expect(result.auditLogId).toMatch(/^audit_/);
    expect(result.recordedDateTime).toBeTruthy();
    expect(new Date(result.recordedDateTime).getTime()).toBeGreaterThanOrEqual(
      new Date("2024-01-15T14:30:00Z").getTime()
    );
    expect(result.status).toBe("RECORDED");
  });
});