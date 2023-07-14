export default {
    preset: 'ts-jest/presets/js-with-babel',
    // preset: 'ts-jest',
    // preset: 'ts-jest/presets/default-esm',
    // preset: 'ts-jest/presets/js-with-ts',
    // preset: 'ts-jest/presets/js-with-ts-esm',
    // preset: 'ts-jest/presets/js-with-babel-esm',
    // preset: 'ts-jest/presets/js-with-ts-esm-legacy',
    // preset: 'ts-jest/presets/js-with-babel-esm-legacy',
    // preset: 'ts-jest/presets/js-with-babel-legacy',
    // testEnvironment: 'node',
    // extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.jsx?$': [
            'babel-jest',
            {
                tsconfig: {
                    allowSyntheticDefaultImports: true,
                    declaration: true,
                    esModuleInterop: true,
                    lib: ['esnext'],
                    module: 'commonjs',
                    moduleResolution: 'node',
                    outDir: 'build',
                    sourceMap: true,
                    target: 'es6',
                    strictNullChecks: false,
                    noImplicitAny: false,
                },
            },
        ],
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    allowSyntheticDefaultImports: true,
                    declaration: true,
                    esModuleInterop: true,
                    lib: ['esnext'],
                    module: 'es2020',
                    moduleResolution: 'node',
                    outDir: 'dist',
                    sourceMap: true,
                    strictNullChecks: true,
                    target: 'ES2020',
                    strictNullChecks: false,
                    noImplicitAny: false,
                },
            },
        ],
    },
    // transformIgnorePatterns: ['/node_modules/(.*)'], // ignore list
    // transformIgnorePatterns: ['/node_modules/(?!package-name)(.*)'], // ignore all but one
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    modulePaths: ['<rootDir>'],
    testRegex: '\\.spec\\.ts$',
    moduleNameMapper: {
        '@/(.*)': '<rootDir>/$1',
        '@test/(.*)': '<rootDir>/../test/$1',
        // esm config
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    // Automatically clear mock calls and instances between every test
    // clearMocks: true,
    // // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: true,
    // // An array of glob patterns indicating a set of files for which coverage information should be collected
    // collectCoverageFrom: ['src/*.mjs'],
    // // The directory where Jest should output its coverage files
    // coverageDirectory: 'coverage',
    // // An array of regexp pattern strings used to skip coverage collection
    // coveragePathIgnorePatterns: ['/node_modules/', 'test/fixture'],
    // // Indicates which provider should be used to instrument code for coverage
    // coverageProvider: 'v8',
};
