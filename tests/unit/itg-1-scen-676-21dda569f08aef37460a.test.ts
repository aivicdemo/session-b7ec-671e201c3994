import { saveWorkInstruction } from '../../src/logic/data-persistence';

describe('SCEN-676: saveWorkInstruction validation error handling', () => {
  const validBaseInput = {
    facilityId: 'fac-123',
    teamId: 'team-456',
    workInstructionNumber: 'WI-001',
    workName: 'Test Work',
    plannedStartDateTime: '2024-01-15T09:00:00Z',
    plannedEndDateTime: '2024-01-15T17:00:00Z',
    progressStatus: 'pending',
    requiredWorkerCount: 5,
    priority: 'high',
    createdBy: 'user-789',
  };

  describe('Invalid workInstructionId', () => {
    it('should throw InvalidWorkInstructionData when workInstructionId is empty string', async () => {
      const input = {
        ...validBaseInput,
        workInstructionId: '',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when workInstructionId contains only special characters', async () => {
      const input = {
        ...validBaseInput,
        workInstructionId: '!@#$%',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });

  describe('Invalid facilityId', () => {
    it('should throw InvalidWorkInstructionData when facilityId is null', async () => {
      const input = {
        ...validBaseInput,
        facilityId: null as any,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when facilityId is empty string', async () => {
      const input = {
        ...validBaseInput,
        facilityId: '',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });

  describe('Invalid teamId', () => {
    it('should throw InvalidWorkInstructionData when teamId is null', async () => {
      const input = {
        ...validBaseInput,
        teamId: null as any,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when teamId is empty string', async () => {
      const input = {
        ...validBaseInput,
        teamId: '',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });

  describe('Invalid workName', () => {
    it('should throw InvalidWorkInstructionData when workName is null', async () => {
      const input = {
        ...validBaseInput,
        workName: null as any,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when workName is empty string', async () => {
      const input = {
        ...validBaseInput,
        workName: '',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });

  describe('Invalid plannedStartDateTime', () => {
    it('should throw InvalidWorkInstructionData when plannedStartDateTime is not ISO 8601 format', async () => {
      const input = {
        ...validBaseInput,
        plannedStartDateTime: '2024/01/15 09:00:00',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when plannedStartDateTime has invalid date values', async () => {
      const input = {
        ...validBaseInput,
        plannedStartDateTime: '2024-13-45T09:00:00Z',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });

  describe('Invalid plannedEndDateTime', () => {
    it('should throw InvalidWorkInstructionData when plannedEndDateTime is not ISO 8601 format', async () => {
      const input = {
        ...validBaseInput,
        plannedEndDateTime: '2024/01/15 17:00:00',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when plannedEndDateTime has invalid date values', async () => {
      const input = {
        ...validBaseInput,
        plannedEndDateTime: '2024-13-45T17:00:00Z',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });

  describe('Invalid requiredWorkerCount', () => {
    it('should throw InvalidWorkInstructionData when requiredWorkerCount is 0', async () => {
      const input = {
        ...validBaseInput,
        requiredWorkerCount: 0,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when requiredWorkerCount is negative', async () => {
      const input = {
        ...validBaseInput,
        requiredWorkerCount: -5,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when requiredWorkerCount is non-integer', async () => {
      const input = {
        ...validBaseInput,
        requiredWorkerCount: 5.5,
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });

  describe('Invalid priority', () => {
    it('should throw InvalidWorkInstructionData when priority is not a defined value', async () => {
      const input = {
        ...validBaseInput,
        priority: '特高',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when priority is "very high"', async () => {
      const input = {
        ...validBaseInput,
        priority: 'very high',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });

    it('should throw InvalidWorkInstructionData when priority is empty string', async () => {
      const input = {
        ...validBaseInput,
        priority: '',
      };

      await expect(saveWorkInstruction(input)).rejects.toThrow('作業指示データの形式が不正です。必須項目を確認してください。');
    });
  });
});