# FDlib

Shared library code for sub-packages of the [fdq](https://github.com/qfox/fdq) package. This package is probably pretty useless outside of that package.

## Installing

```
npm install fdlib
```

## Tasks

There are a few grunt tasks and bash scripts hooked up to npm. This repo also uses git hooks for pre- and post commit hooks.

As a general rule, `./build` is used for any temporary output, including code coverage reports and temporary build files when producing a dist.

(These tasks obviously require an `npm install`)

### Grunt tasks:

- `grunt clean`: removes `./dist` and `./build`
- `grunt coverage`: runs all tests in the code coverage tool
- `grunt test`: runs linting and all tests
- `grunt testq`: runs tests without linting
- `grunt watch:t`: runs `testq` whenever a file changes

### Bash / npm scripts:

- `npm run lint`: run eslint with dist config (slightly stricter than dev). Exits non-zero if it fails.
- `npm run lintdev`: run eslint with dev config (allows `console.log`, `debugger`, etc). No non-zero exit for failures.
- `npm run lintfix`: runs eslint in the fix mode
