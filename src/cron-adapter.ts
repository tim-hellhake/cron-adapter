/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Adapter, Device, Event, Database } from 'gateway-addon';

import crypto from 'crypto';

import { schedule } from 'node-cron';

const CRON_EVENT = 'fired';

class CronDevice extends Device {
    constructor(adapter: any, id: string, name: string, cron: string) {
        super(adapter, id);
        this['@context'] = 'https://iot.mozilla.org/schemas/';
        this.name = name;

        this.events.set(CRON_EVENT, {
            name: CRON_EVENT,
            metadata: {
                description: 'Cron job fired',
                type: 'string'
            }
        });

        schedule(cron, () => {
            this.eventNotify(new Event(this, CRON_EVENT));
        });
    }
}

export class CronAdapter extends Adapter {
    private readonly database: Database;

    constructor(addonManager: any, manifest: any) {
        super(addonManager, CronAdapter.name, manifest.name);
        this.database = new Database(manifest.name)
        addonManager.addAdapter(this);
        this.createCronJobs();
    }

    private async createCronJobs() {
        const cronJobs = await this.loadCronJobs();

        if (cronJobs) {
            for (const cronJob of cronJobs) {
                const cron = new CronDevice(this, cronJob.id, cronJob.name, cronJob.cron);
                this.handleDeviceAdded(cron);
            }
        }
    }

    private async loadCronJobs() {
        await this.database.open();
        const config = await this.database.loadConfig();
        const {
            cronJobs
        } = config;

        if (cronJobs) {
            for (const cronJob of cronJobs) {
                if (!cronJob.id) {
                    cronJob.id = crypto.randomBytes(16).toString("hex");
                }
            }
        }

        await this.database.saveConfig(config);
        return cronJobs;
    }
}
