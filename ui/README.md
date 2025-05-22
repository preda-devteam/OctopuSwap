### Requirement

- nodejs >=18.17.0
  > [install](https://registry.npmmirror.com/binary.html?path=node/)
- pm2 + pm2-intercom + pm2-logrotate-ext
- yarn

### Dev

use [next](https://www.nextjs.cn/) + ts

```
$ yarn dev
$ open http://localhost:11000
```

### Prod

Install `pm2` `pm2-intercom ` `pm2-logrotate-ext` when delpoying the application for the first time, then configure `pm2-logrotate-ext`

```
$ yarn global add pm2
$ pm2 install pm2-intercom
$ pm2 install pm2-logrotate-ext
$ pm2 set pm2-logrotate-ext:max_size 20M
```

- Runing in backgrounder

```
$ yarn deploy:pm2
```

### Test

use [jest](https://jestjs.io/) + [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)

```
$ yarn test
```

### Lint

use eslint + [prettier](https://prettier.io/)

use [commitlint](https://github.com/conventional-changelog/commitlint) to lint commit messages

```
$ yarn lint
```

### Other

use [husky](https://www.npmjs.com/package/husky) + [lint-staged](https://www.npmjs.com/package/lint-staged) for commit hook

use github action (config is in release.yml) + [standard-version](https://github.com/conventional-changelog/standard-version) to auto create changelog, push tag, update version
