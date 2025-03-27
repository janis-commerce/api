'use strict';

// @ts-expect-error TS7016
require('lllog')('none');

process.env.TZ = 'UTC';
