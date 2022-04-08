/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import {fromRollup, rollupAdapter} from '@web/dev-server-rollup';
import {legacyPlugin} from '@web/dev-server-legacy';

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

export default {
  mimeTypes: {
    // serve all json files as js
    '**/*.json': 'js',
    // serve .module.css files as js
    '**/*.module.css': 'js',
  },
  nodeResolve: {exportConditions: mode === 'dev' ? ['development'] : []},
  preserveSymlinks: true,
  plugins: [
    fromRollup(commonjs)(),
    rollupAdapter(json()),
    legacyPlugin({
      polyfills: {
        // Manually imported in index.html file
        webcomponents: false,
      },
    }),
  ],
};
