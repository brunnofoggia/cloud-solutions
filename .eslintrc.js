module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: ['.eslintrc.js', '*.spec.ts', '*.e2e-spec.ts'],
    rules: {
        '@typescript-eslint/interface-name-prefix': 0,
        '@typescript-eslint/no-explicit-any': 0,
        'security/detect-object-injection': 0,
        '@typescript-eslint/no-empty-interface': 0,
        '@typescript-eslint/no-unsafe-declaration-merging': 0,
        '@typescript-eslint/no-unused-vars': 0,
        // promises
        // 'require-await': 1,
        // 'promise/always-return': 1,
        '@typescript-eslint/no-floating-promises': 2,
        //
        // '@typescript-eslint/explicit-function-return-type': 0,
        // '@typescript-eslint/explicit-module-boundary-types': 0,
        // '@typescript-eslint/no-floating-promises': 0,
        // temporary
        // '@typescript-eslint/no-unsafe-assignment': 0,
        // '@typescript-eslint/no-unsafe-member-access': 0
    },
};
