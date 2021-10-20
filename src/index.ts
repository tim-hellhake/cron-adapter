/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { CronAdapter } from './cron-adapter';

export = (addonManager: any, manifest: any, errorCallback: (packageName: string, error: string) => void) => new CronAdapter(addonManager, manifest, (error: string) => errorCallback('cron-adapter', error));
