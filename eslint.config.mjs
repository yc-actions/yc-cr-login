import github from 'eslint-plugin-github'

export default [
    github.getFlatConfigs().recommended,
    ...github.getFlatConfigs().typescript,
    {
        files: ['**/*.{ts,tsx,mtsx}'],
        ignores: ['eslint.config.mjs', './dist/'],
        rules: {
            'github/array-foreach': 'error',
            'github/async-preventdefault': 'warn',
            'github/no-then': 'error',
            'github/no-blur': 'error',
            'i18n-text/no-en': 'off'
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: false,
                    project: './tsconfig.json'
                }
            }
        }
    }
]
