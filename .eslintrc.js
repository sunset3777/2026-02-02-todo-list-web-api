module.exports = {
  // 忽略的檔案和目錄
  ignorePatterns: ["node_modules/", "dist/", "exam.js"],

  // 環境設定
  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  // 繼承的設定（順序很重要）
  extends: [
    "airbnb-base", // Airbnb 風格
    "prettier", // Prettier 設定，放最後避免衝突
  ],

  // 解析器選項
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },

  // 自訂規則
  rules: {
    // 允許使用 console/alert
    "no-console": "warn",
    'no-alert': 'warn',

    // 允許 ++
    "no-plusplus": "off",

    // 改為警告而非錯誤
    "prefer-template": "warn", // 字串連接
    "prefer-destructuring": "warn", // 解構賦值

    // 允許修改物件的屬性，但不允許重新賦值參數本身
    "no-param-reassign": [
      "error",
      {
        props: false, // 允許修改參數的屬性
      },
    ],

    // 允許特定參數名稱重複
    "no-shadow": [
      "error",
      {
        allow: ["users"],
      },
    ],
  },
};