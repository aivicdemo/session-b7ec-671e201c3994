import { saveWorkInstructionReceptionHistory } from "../../src/logic/data-persistence";
import { SaveWorkInstructionReceptionHistoryInput, SaveWorkInstructionReceptionHistoryOutput } from "../../src/logic/data-persistence";

describe("SCEN-1037: 受領履歴IDがundefinedで指定されたときは新規作成として処理される", () => {
  let validateReferentialIntegritySpy: jest.SpyInstance;
  let validateDateTimeRangeSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    validateReferentialIntegritySpy = jest.fn().mockResolvedValue(true);
    validateDateTimeRangeSpy = jest.fn().mockResolvedValue(true);

    (global as any).validateReferentialIntegrity = validateReferentialIntegritySpy;
    (global as any).validateDateTimeRange = validateDateTimeRangeSpy;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("受領履歴IDがundefinedの場合、新規作成として処理されUUIDが生成される", async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: undefined,
      workInstructionId: "WI-001",
      workerId: "WK-001",
      receptionDateTime: "2024-01-15T10:30:00.000Z",
      receptionStatus: "confirmed",
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal",
      remarks: null,
      createdBy: "USR-001",
      updatedBy: undefined,
    };

    validateReferentialIntegritySpy.mockResolvedValue(true);
    validateDateTimeRangeSpy.mockResolvedValue(true);

    const result: SaveWorkInstructionReceptionHistoryOutput = await saveWorkInstructionReceptionHistory(input);

    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBeDefined();
    expect(result.receptionHistoryId).not.toEqual(undefined);
    expect(typeof result.receptionHistoryId).toBe("string");
    expect(result.receptionHistoryId.length).toBeGreaterThan(0);
  });

  it("新規作成時に入力値がそのまま出力に含まれることを確認", async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: undefined,
      workInstructionId: "WI-001",
      workerId: "WK-001",
      receptionDateTime: "2024-01-15T10:30:00.000Z",
      receptionStatus: "confirmed",
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal",
      remarks: null,
      createdBy: "USR-001",
      updatedBy: undefined,
    };

    validateReferentialIntegritySpy.mockResolvedValue(true);
    validateDateTimeRangeSpy.mockResolvedValue(true);

    const result: SaveWorkInstructionReceptionHistoryOutput = await saveWorkInstructionReceptionHistory(input);

    expect(result.workInstructionId).toBe("WI-001");
    expect(result.workerId).toBe("WK-001");
    expect(result.receptionDateTime).toBe("2024-01-15T10:30:00.000Z");
    expect(result.receptionStatus).toBe("confirmed");
  });

  it("新規作成時にsavedAtがISO 8601形式で返されることを確認", async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: undefined,
      workInstructionId: "WI-001",
      workerId: "WK-001",
      receptionDateTime: "2024-01-15T10:30:00.000Z",
      receptionStatus: "confirmed",
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal",
      remarks: null,
      createdBy: "USR-001",
      updatedBy: undefined,
    };

    validateReferentialIntegritySpy.mockResolvedValue(true);
    validateDateTimeRangeSpy.mockResolvedValue(true);

    const result: SaveWorkInstructionReceptionHistoryOutput = await saveWorkInstructionReceptionHistory(input);

    expect(result.savedAt).toBeDefined();
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(iso8601Regex.test(result.savedAt)).toBe(true);
  });

  it("新規作成時にisNewRecordがtrueで返されることを確認", async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: undefined,
      workInstructionId: "WI-001",
      workerId: "WK-001",
      receptionDateTime: "2024-01-15T10:30:00.000Z",
      receptionStatus: "confirmed",
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal",
      remarks: null,
      createdBy: "USR-001",
      updatedBy: undefined,
    };

    validateReferentialIntegritySpy.mockResolvedValue(true);
    validateDateTimeRangeSpy.mockResolvedValue(true);

    const result: SaveWorkInstructionReceptionHistoryOutput = await saveWorkInstructionReceptionHistory(input);

    expect(result.isNewRecord).toBe(true);
  });

  it("参照整合性の検証が呼び出されることを確認", async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: undefined,
      workInstructionId: "WI-001",
      workerId: "WK-001",
      receptionDateTime: "2024-01-15T10:30:00.000Z",
      receptionStatus: "confirmed",
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal",
      remarks: null,
      createdBy: "USR-001",
      updatedBy: undefined,
    };

    validateReferentialIntegritySpy.mockResolvedValue(true);
    validateDateTimeRangeSpy.mockResolvedValue(true);

    await saveWorkInstructionReceptionHistory(input);

    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
  });

  it("日時範囲の検証が呼び出されることを確認", async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: undefined,
      workInstructionId: "WI-001",
      workerId: "WK-001",
      receptionDateTime: "2024-01-15T10:30:00.000Z",
      receptionStatus: "confirmed",
      confirmationDateTime: "2024-01-15T10:35:00.000Z",
      deliveryMethod: "handy_terminal",
      remarks: null,
      createdBy: "USR-001",
      updatedBy: undefined,
    };

    validateReferentialIntegritySpy.mockResolvedValue(true);
    validateDateTimeRangeSpy.mockResolvedValue(true);

    await saveWorkInstructionReceptionHistory(input);

    expect(validateDateTimeRangeSpy).toHaveBeenCalled();
  });
});