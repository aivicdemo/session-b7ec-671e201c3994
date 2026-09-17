// AIVIC Backend Configuration
// AIVIC_APP_URL 環境変数が設定されている場合は自動セットされます
// 未設定の場合: REPLACE_WITH_API_URL を AIVIC アプリの URL（例: https://your-app.amplifyapp.com）に書き換えてください

window.AIVIC_API_URL = "REPLACE_WITH_API_URL";
window.AIVIC_TABLES = {
  "拠点": 0,
  "チーム": 1,
  "作業者習熟度": 2,
  "作業指示": 3,
  "作業実績": 4,
  "人員配置案": 5,
  "人員配置実行状況": 6,
  "進捗データ": 7,
  "進捗遅延リスク判定結果": 8,
  "作業指示受領履歴": 9,
  "ハンディターミナル連携ログ": 10,
  "WMS連携ログ": 11
};
