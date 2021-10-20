/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Adapter, Device, Event } from 'gateway-addon';
import { CronJob } from 'cron';
import { load, CronJobV2 } from './config';

class CronDevice extends Device {
    constructor(adapter: any, id: string, name: string, cronJobs: CronJobV2[], timezone: string, errorCallback: (error: string) => void) {
        super(adapter, id);
        this['@context'] = 'https://iot.mozilla.org/schemas/';
        this.name = name;

        for (const cronJob of cronJobs) {
            const {
                name,
                cron
            } = cronJob;

            this.events.set(name, {
                name: name,
                metadata: {
                    description: `Cron job ${name} fired`,
                    type: 'string'
                }
            });

            try { 
                new CronJob(cron, () => {
                    this.eventNotify(new Event(this, name));
                    console.log('Fire!');
                }, null, true, timezone);
            } catch (e) {
                errorCallback(`Failed to create cron job for '${cron}': ${e}`);
            }
        }
    }
}

export class CronAdapter extends Adapter {
    constructor(addonManager: any, manifest: any, private errorCallback: (error: string) => void) {
        super(addonManager, CronAdapter.name, manifest.name);
        addonManager.addAdapter(this);
        this.createCronJobs(manifest);
    }

    private async createCronJobs(manifest: any) {
        const {
            timezone,
            cronGroups
        } = await load(manifest);

        if (cronGroups) {
            for (const cronGroup of cronGroups) {
                const {
                    id,
                    name,
                    cronJobs
                } = cronGroup;

                const cron = new CronDevice(this, id, name, cronJobs, timezone, this.errorCallback);
                this.handleDeviceAdded(cron);
            }
        }
    }
}
