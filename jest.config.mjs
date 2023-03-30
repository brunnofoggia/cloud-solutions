export default {
    'moduleFileExtensions': [
        'js',
        'json',
        'ts'
    ],
    'rootDir': 'src',
    'modulePaths': ['<rootDir>'],
    "testRegex": "\\.spec\\.ts$",
    'transform': {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    'collectCoverageFrom': [
        '**/*.(t|j)s'
    ],
    'coverageDirectory': '../coverage',
    'testEnvironment': 'node',
    'moduleNameMapper': {
        '@/(.*)': '<rootDir>/$1',
    },
};
