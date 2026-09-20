import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { saveWorker, getFacilityById, validateInputFormat } from "../../src/logic/data-persistence";
import type { SaveWorkerInput } from "../../src/logic/data-persistence";

describe("SCEN-580: saveWorker - FacilityNotFoundError when facility does not exist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should raise FacilityNotFoundError when specified facilityId does not exist in facility master", async () => {
    // Arrange: テスト用の拠点IDを「存在しない拠点ID」に設定
    const nonExistentFacilityId = "FACILITY-NOT-EXISTS-999";
    const input: SaveWorkerInput = {
      workerId: null,
      workerName: "テスト作業者",
      facilityId: nonExistentFacilityId,
      teamId: "TEAM-001",
      jobType: "作業員",
      operatingStatus: "稼働中",
      createdBy: "USER-001",
    };

    // Arrange: validateInputFormat のスタブを設定して、入力フォーマットが正常と判定するようにする
    jest.mocked(validateInputFormat).mockResolvedValue(undefined);

    // Arrange: getFacilityById のスタブを設定して、facilityId='FACILITY-NOT-EXISTS-999' が渡されたときに null を返す
    jest.mocked(getFacilityById).mockResolvedValue(null);

    // Act & Assert: saveWorker 関数を、準備した SaveWorkerInput で呼び出す
    // FacilityNotFoundError が発生し、エラー文言が「指定された拠点が見つかりません。」であることを確認
    await expect(saveWorker(input)).rejects.toMatchObject({
      name: "FacilityNotFoundError",
      message: "指定された拠点が見つかりません。",
    });

    // Assert: validateInputFormat が呼ばれたことを確認
    expect(jest.mocked(validateInputFormat)).toHaveBeenCalledWith(input);

    // Assert: getFacilityById が指定されたfacilityIdで呼ばれたことを確認
    expect(jest.mocked(getFacilityById)).toHaveBeenCalledWith(nonExistentFacilityId);
  });
});