import { deleteDataByConditionAndType } from "../../src/logic/data-persistence";
import * as validationCommonCalculation from "../../src/logic/validation-common-calculation";
import * as authAuthorizationAudit from "../../src/logic/auth-authorization-audit";

jest.mock("../../src/logic/validation-common-calculation");
jest.mock("../../src/logic/auth-authorization-audit");

describe("SCEN-1141: deleteDataByConditionAndType - Referential Integrity Violation", () => {
  const mockValidateReferentialIntegrity = validationCommonCalculation.validateReferentialIntegrity as jest.MockedFunction<
    typeof validationCommonCalculation.validateReferentialIntegrity
  >;
  const mockAuthorizeOperation = authAuthorizationAudit.authorizeOperation as jest.MockedFunction<
    typeof authAuthorizationAudit.authorizeOperation
  >;
  const mockRecordOperationAudit = authAuthorizationAudit.recordOperationAudit as jest.MockedFunction<
    typeof authAuthorizationAudit.recordOperationAudit
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ReferentialIntegrityViolationError when deletion target is referenced by other tables", async () => {
    const targetWorkerId = "worker-001";
    const dataType = "worker";
    const filterCondition = { workerId: targetWorkerId };
    const deletedBy = "authorized-user-id";

    mockAuthorizeOperation.mockResolvedValue(true);
    mockValidateReferentialIntegrity.mockResolvedValue(true);

    let thrownError: unknown = null;

    try {
      await deleteDataByConditionAndType(dataType, filterCondition, deletedBy);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);

    const errorAsError = thrownError as Error;
    expect(errorAsError.name).toBe("ReferentialIntegrityViolationError");
    expect(errorAsError.message).toBe(
      "削除対象レコードは他のデータから参照されているため削除できません。"
    );

    expect(mockRecordOperationAudit).not.toHaveBeenCalled();

    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(
      dataType,
      filterCondition,
      expect.any(Object)
    );

    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      deletedBy,
      expect.stringMatching(/delete/i),
      expect.any(Object)
    );
  });
});