import { test, expect } from '@playwright/test';

test.describe('実績データ保存', () => {
  test('境界系：品質スコアが上限値（1.0）で送信されても、入力データ検証に合格して記録される', async ({ page }) => {
    // 作業実績データ記録・入力画面を開く
    await page.goto('/panels/scr-1789461993203.html');
    
    // 必須項目を入力する
    const workerId = 'WKR001';
    const taskType = 'assembly';
    const department = 'production';
    const workHours = '8.0';
    const qualityScore = '1.0';
    
    // 作業者ID入力
    await page.fill('input[name="workerId"]', workerId);
    
    // 作業タイプ選択
    await page.selectOption('select[name="taskType"]', taskType);
    
    // 部門選択
    await page.selectOption('select[name="department"]', department);
    
    // 作業時間入力
    await page.fill('input[name="workHours"]', workHours);
    
    // 品質スコア項目に上限値である「1.0」を入力する
    await page.fill('input[name="qualityScore"]', qualityScore);
    
    // 保存ボタンをクリックして実績データを送信する
    await page.click('button:has-text("保存")');
    
    // 保存完了メッセージが表示されることを確認
    const successMessage = page.locator('text=/保存|成功|完了/');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // 生産性ダッシュボード・分析画面で保存されたデータを確認
    await page.goto('/panels/scr-1789461964046.html');
    
    // 保存されたデータが品質スコア1.0として参照可能になることを確認
    // テーブルまたはデータ表示領域で最新の記録を検索
    const qualityScoreCell = page.locator(`text=${qualityScore}`);
    await expect(qualityScoreCell).toBeVisible({ timeout: 10000 });
  });
});