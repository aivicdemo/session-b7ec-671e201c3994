import { findComparisonAnalysisResultsByType } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-697: Unauthorized access to comparison analysis results', () => {
  it('should throw UnauthorizedAccessError when user is not authenticated', async () => {
    // Arrange
    const analysisType = '初期割当実績比較';
    const sortOrder = 'desc' as const;
    const requestingUserId = 'unauthenticated_user';

    // Mock authorizeUserAction to simulate authentication failure
    const authorizeUserActionSpy = jest.spyOn(persistenceLayer as any, 'authorizeUserAction' as any).mockImplementation(() => {
      const error = new Error('比較分析結果へのアクセス権限がありません。');
      (error as any).name = 'UnauthorizedAccessError';
      throw error;
    });

    // Act & Assert
    await expect(
      findComparisonAnalysisResultsByType({
        analysisType,
        sortOrder,
        requestingUserId,
      })
    ).rejects.toThrow();

    try {
      await findComparisonAnalysisResultsByType({
        analysisType,
        sortOrder,
        requestingUserId,
      });
    } catch (error: any) {
      // Assert: Verify authorizeUserAction was called
      expect(authorizeUserActionSpy).toHaveBeenCalled();

      // Assert: Verify exception properties
      expect(error.name).toBe('UnauthorizedAccessError');
      expect(error.message).toBe('比較分析結果へのアクセス権限がありません。');
    } finally {
      authorizeUserActionSpy.mockRestore();
    }
  });
});