# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
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
