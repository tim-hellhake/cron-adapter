/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Database } from "gateway-addon";
import crypto from 'crypto';

export interface Config {
    timezone: string,
    cronJobs: CronJobV1[]
}

export interface CronJobV1 {
    id: string,
    name: string,
    cron: string
}

export interface ConfigV2 {
    timezone: string,
    cronGroups: CronGroup[]
}

export interface CronGroup {
    id: string,
    name: string,
    cronJobs: CronJobV2[]
}

export interface CronJobV2 {
    name: string,
    cron: string
}

export async function load(manifest: any): Promise<ConfigV2> {
    const database = new Database(manifest.name);
    await database.open();
    const config: Config & ConfigV2 = await database.loadConfig();
    const configv2 = asConfigV2(config);
    await database.saveConfig(configv2);

    return configv2;
}

function asConfigV2(config: Config & ConfigV2): ConfigV2 {
    const {
        timezone,
        cronJobs,
        cronGroups
    } = config;

    return {
        timezone,
        cronGroups: [...asCronGroups(cronJobs || []), ...(cronGroups || []).map(withId)]
    };
}

function asCronGroups(cronJobs: CronJobV1[]): CronGroup[] {
    return cronJobs.map(cronJob => {
        const {
            id,
            name,
            cron
        } = cronJob;

        console.log(`Migrating ${name} to v2`);

        return {
            id,
            name,
            cronJobs: [{ name: 'fired', cron }]
        };
    });
}

function withId<T extends { id: string, name: string }>(obj: T): T {
    const {
        id,
        name
    } = obj

    if (!id) {
        const generatedId = crypto.randomBytes(16).toString("hex");

        console.log(`Generated id ${generatedId} for ${name}`);

        return {
            ...obj,
            id: generatedId
        }
    }

    return obj;
}
