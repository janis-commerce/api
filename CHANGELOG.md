# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.4.0] - 2021-11-11
### Added
- Errors are not masqueraded any more
- Added `rawData` getter and setter

### Fixed
- Now logs are saved with the original data

## [6.3.0] - 2021-06-11
### Added
- Now API Request logs have basic information in the `message` property

## [6.2.2] - 2021-05-10
### Fixed
- Avoid sending `userCreated` to the Log if the Request was not performed by a User

## [6.2.1] - 2021-01-27
### Added
- Typings build from JSDoc

## [6.2.0] - 2020-12-01
### Added
- Added `userId` for logs

### Changed
- Created `LogHelper` to improve package organization

## [6.1.0] - 2020-11-25
### Added
- Added `logId` property to each api instance

## [6.0.1] - 2020-08-01
### Fixed
- Fix isObject helper

## [6.0.0] - 2020-08-27
### Added
- GitHub Actions for build, coverage and publish

### Changed
- Updated `@janiscommerce/api-session` to `3.x.x`

## [5.1.2] - 2020-07-31
### Changed
- Changed `superstruct` for `@janiscommerce/superstruct`

## [5.1.1] - 2020-06-24
### Fixed
- Now responses without `messageVariables` are retro-compatible

## [5.1.0] - 2020-06-23
### Added
- Added support for error response with messageVariables
- Added new `ErrorWithVariables` to easily send a response with variables

## [5.0.1] - 2020-06-18
### Removed
- Removed useless API inheritance validation

## [5.0.0] - 2020-06-15
### Changed
- Updated @janiscommerce/api-session to `2.x.x`

## [4.3.0] - 2020-05-19
### Removed
- `package-lock.json` file

## [4.2.5] - 2020-05-15
### Changed
- Dependencies updated

## [4.2.4] - 2020-04-16
### Fixed
- Logs for api request not awaited causing some logs not to be successfully sent

## [4.2.3] - 2020-04-03
### Changed
- Dependencies updated

## [4.2.2] - 2020-02-18
### Changed
- Dependencies updated

## [4.2.1] - 2020-01-21
### Changed
- Dependencies updated

## [4.2.0] - 2019-11-12
### Added
- Logs for api requests

## [4.1.1] - 2019-10-01
### Changed
- Model version updated to avoid dependency versions issues

## [4.1.0] - 2019-10-01
### Changed
- API Session updated to provide `getSessionInstance` method

## [4.0.0] - 2019-10-01
### Changed
- Client injection changed to API Session injection (**BREAKING CHANGE**)
- Settings changed due to @janiscommerce/api-session package (**BREAKING CHANGE**)

### Removed
- Logger is not a dependency any more

### Added
- Now `APIError` can wrap a previous error
- API Controllers cache in fetcher

## [3.2.0] - 2019-08-02
### Changed
- Client Identifiers now works case insensitive

## [3.1.1] - 2019-07-23
### Fixed
- Fix for AWS request path without basePath

## [3.1.0] - 2019-07-20
### Added
- Request endpoint is now passed to the API

## [3.0.1] - 2019-07-19
### Fixed
- Fix some weird package-lock problem

## [3.0.0] - 2019-07-18
### Removed
- `API base` - getInstance helper

### Changed
- Updated `active-client` package for having getInstance

## [2.0.1] - 2019-07-18
### Fixed
- Dependencies updated

## [2.0.0] - 2019-07-15
### Added
- `API base` - getInstance helper for propagate client

### Removed
- `Controller` functionality

## [1.7.0] - 2019-07-11
### Added
- ENV `MS_PATH` - path prefix

## [1.6.0] - 2019-07-04
### Added
- `Settings` with `@janiscommerce/settings`

### Changed
- improves in `README.md`

## [1.5.0] - 2019-06-28
### Added
- `ActiveClient`
- `Client` injected in `API`
- `API` getController returns a Controller instance

### Changed
- improved `tests` organization
- improves in `README.md`

### Fixed
- `Fetcher` jsdocs

## [1.4.0] - 2019-06-18
### Added
- `husky` added for pre-commit

### Changed
- `Dispatcher` renamed
- `Dispatcher` prepare() better validation
- `API` response default values for `code` and `body`
- `lib` folder for package content
- `eslint` configs

## [1.3.0] - 2019-06-12
### Added
- Improved `README.md`
- Dispatcher
- `API` inheritance

## [1.2.0] - 2019-05-29
### Added
- Api tests
- Excluded tests folder from coverage

## [1.1.0] - 2019-05-29
### Added
- `Travis` CI and `Coveralls` integrations

## [1.0.0] - 2019-05-27
### Added
- Project inited
- API Dispatch
- Fetcher
- Tests
