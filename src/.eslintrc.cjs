module.exports = {
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    env: {
        browser: true,
        es2021: true,
        jquery: true,
    },
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        'prettier/prettier': 'error',
        'no-unused-vars': 'off',
    },
};