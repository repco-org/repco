---
title: Testing
---

# Testing

Repco includes both unit and integration tests. The integration tests run PostgreSQL via Docker, so you need to have Docker installed on your machine.

To run all tests, run `yarn test` from the repo root.

To run specific tests, `cd` into the package, build regularily (`yarn build`) and then run the test file directly. E.g.:
```
cd packages/repco-core
yarn build
node dist/test/basic.js
```

### Tests with fixture

Some tests for datasources include foreign API responses as test fixtures. We use a `fetch` adaptor for this which transparently disables networking and uses presaved fixtures instead.
By default, the tests run against the fixtures.
To recreate the fixtures, you can set these environment variables. When recreating, the fetch requests are run against the actual online API and the responses are saved in `repco-core/test/fixtures`.

|||
|-|-|
|`CREATE_FIXTURES=1`|Recreate all test fixtures|
|`CREATE_FETCH_FIXTURES=1`|Recreate only the fetch fixtures|
|`CREATE_ASSERT_FIXTURES=1`|Recreate only result fixtures for assertions|

`repco-core/test/cba.ts` contains a test case that uses these features.

A typical flow would be:

* Write the test
* Create all fixtures by running `CREATE_FIXTURES=1 node dist/test/cba.js`
* Iterate on some feature
* Note that the test fails because the feature changed the result (assert) fixture
* Recreate the assert fixture by running `CREATE_ASSERT_FIXTURES=1 node dist/test/cba.js`
* The fetch fixtures would only need to be recreated if you changed a fetch call or if the upstream API changes
