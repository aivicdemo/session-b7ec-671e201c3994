import { saveWorkInstructionReceptionHistory } from "../../src/logic/data-persistence";
import { SaveWorkInstructionReceptionHistoryInput, SaveWorkInstructionReceptionHistoryOutput } from "../../src/logic/data-persistence";

describe("SCEN-1035: 備考が指定されていないときは任意項目として受け入れられる", () => {
  it("remarksがnullのときに作業指示受領履歴を正常に新規作成する", async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: "wi-12345",
      workerId: "worker-67890",
      receptionDateTime: "2024-01-15T10:30:00.000Z",
      receptionStatus: "confirmed",
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal",
      remarks: null,
      createdBy: "user-admin"
    };

    // Act
    const output = await saveWorkInstructionReceptionHistory(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.receptionHistoryId).toBeTruthy();
    expect(output.workInstructionId).toBe(input.workInstructionId);
    expect(output.workerId).toBe(input.workerId);
    expect(output.receptionDateTime).toBe(input.receptionDateTime);
    expect(output.receptionStatus).toBe(input.receptionStatus);
    expect(output.savedAt).toBeTruthy();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.savedAt)).toBe(true);
    expect(output.isNewRecord).toBe(true);
  });

  it("remarksが指定されていないときに作業指示受領履歴を正常に新規作成する", async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: "wi-54321",
      workerId: "worker-98765",
      receptionDateTime: "2024-01-16T14:20:00.000Z",
      receptionStatus: "pending",
      deliveryMethod: "email",
      createdBy: "user-system"
    };

    // Act
    const output = await saveWorkInstructionReceptionHistory(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.receptionHistoryId).toBeTruthy();
    expect(output.workInstructionId).toBe(input.workInstructionId);
    expect(output.workerId).toBe(input.workerId);
    expect(output.receptionDateTime).toBe(input.receptionDateTime);
    expect(output.receptionStatus).toBe(input.receptionStatus);
    expect(output.savedAt).toBeTruthy();
    expect(output.isNewRecord).toBe(true);
  });

  it("remarksが空文字列のときに作業指示受領履歴を正常に新規作成する", async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: "wi-11111",
      workerId: "worker-22222",
      receptionDateTime: "2024-01-17T09:15:00.000Z",
      receptionStatus: "confirmed",
      deliveryMethod: "system_notification",
      remarks: "",
      createdBy: "user-operator"
    };

    // Act
    const output = await saveWorkInstructionReceptionHistory(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.receptionHistoryId).toBeTruthy();
    expect(output.workInstructionId).toBe(input.workInstructionId);
    expect(output.workerId).toBe(input.workerId);
    expect(output.receptionStatus).toBe(input.receptionStatus);
    expect(output.isNewRecord).toBe(true);
  });

  it("remarksが有効な値のときに作業指示受領履歴を正常に新規作成する", async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: "wi-33333",
      workerId: "worker-44444",
      receptionDateTime: "2024-01-18T16:45:00.000Z",
      receptionStatus: "rejected",
      confirmationDateTime: "2024-01-18T16:50:00.000Z",
      deliveryMethod: "email",
      remarks: "担当者不在のため翌日対応予定",
      createdBy: "user-admin"
    };

    // Act
    const output = await saveWorkInstructionReceptionHistory(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.receptionHistoryId).toBeTruthy();
    expect(output.workInstructionId).toBe(input.workInstructionId);
    expect(output.workerId).toBe(input.workerId);
    expect(output.receptionDateTime).toBe(input.receptionDateTime);
    expect(output.receptionStatus).toBe(input.receptionStatus);
    expect(output.savedAt).toBeTruthy();
    expect(output.isNewRecord).toBe(true);
  });

  it("複数の異なるreceptionStatusを持つレコードを連続して作成できる", async () => {
    // Arrange
    const inputs: SaveWorkInstructionReceptionHistoryInput[] = [
      {
        receptionHistoryId: null,
        workInstructionId: "wi-multi-1",
        workerId: "worker-multi-1",
        receptionDateTime: "2024-01-19T10:00:00.000Z",
        receptionStatus: "pending",
        deliveryMethod: "handy_terminal",
        remarks: null,
        createdBy: "user-system"
      },
      {
        receptionHistoryId: null,
        workInstructionId: "wi-multi-2",
        workerId: "worker-multi-2",
        receptionDateTime: "2024-01-19T10:05:00.000Z",
        receptionStatus: "confirmed",
        confirmationDateTime: "2024-01-19T10:06:00.000Z",
        deliveryMethod: "system_notification",
        createdBy: "user-system"
      },
      {
        receptionHistoryId: null,
        workInstructionId: "wi-multi-3",
        workerId: "worker-multi-3",
        receptionDateTime: "2024-01-19T10:10:00.000Z",
        receptionStatus: "rejected",
        deliveryMethod: "email",
        remarks: "別案件優先",
        createdBy: "user-system"
      }
    ];

    // Act & Assert
    for (const input of inputs) {
      const output = await saveWorkInstructionReceptionHistory(input);
      expect(output).toBeDefined();
      expect(output.receptionHistoryId).toBeTruthy();
      expect(output.workInstructionId).toBe(input.workInstructionId);
      expect(output.isNewRecord).toBe(true);
    }
  });
});