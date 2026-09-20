import { saveWorkInstructionReceptionHistory } from "../../src/logic/data-persistence";

describe("SCEN-1038: 作業指示の受領履歴データ永続化", () => {
  it("出力の受領日時が入力の受領日時と一致する", async () => {
    // Arrange
    const input = {
      receptionHistoryId: null,
      workInstructionId: "WI-20240115-001",
      workerId: "WKR-00123",
      receptionDateTime: "2024-01-15T10:30:45.123Z",
      receptionStatus: "confirmed" as const,
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal" as const,
      remarks: null,
      createdBy: "USR-admin",
      updatedBy: null,
    };

    // Act
    const output = await saveWorkInstructionReceptionHistory(input);

    // Assert
    expect(output.receptionDateTime).toBe("2024-01-15T10:30:45.123Z");
    expect(output.receptionHistoryId).toBeTruthy();
    expect(typeof output.receptionHistoryId).toBe("string");
    expect(output.workInstructionId).toBe("WI-20240115-001");
    expect(output.workerId).toBe("WKR-00123");
    expect(output.receptionStatus).toBe("confirmed");
    expect(output.isNewRecord).toBe(true);
    expect(output.savedAt).toBeTruthy();
    expect(typeof output.savedAt).toBe("string");
  });
});