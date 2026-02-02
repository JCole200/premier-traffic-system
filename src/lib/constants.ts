import { InventoryItem } from '../types/inventory';

export const INVENTORY_BASELINES: InventoryItem[] = [
    {
        id: 'audio-podcast-unbelievable',
        name: 'Unbelievable? (Podcast)',
        type: 'AUDIO',
        totalCapacity: 200000,
        unit: 'downloads'
    },
    {
        id: 'audio-podcast-ntwright',
        name: 'Ask NT Wright Anything',
        type: 'AUDIO',
        totalCapacity: 200000,
        unit: 'downloads'
    },
    {
        id: 'audio-podcast-bibleyear',
        name: 'Bible In A Year',
        type: 'AUDIO',
        totalCapacity: 100000,
        unit: 'downloads'
    },
    {
        id: 'audio-podcast-bestill',
        name: 'Be Still & Know',
        type: 'AUDIO',
        totalCapacity: 50000,
        unit: 'downloads'
    },
    {
        id: 'audio-podcast-cslewis',
        name: 'The CS Lewis Podcast',
        type: 'AUDIO',
        totalCapacity: 50000,
        unit: 'downloads'
    },
    {
        id: 'audio-stream',
        name: 'Radio Streams',
        type: 'AUDIO',
        totalCapacity: 600000,
        unit: 'streams'
    },
    {
        id: 'display-web',
        name: 'Website Impressions',
        type: 'DISPLAY',
        totalCapacity: 400000,
        unit: 'pageviews'
    },
    {
        id: 'email-list-a',
        name: 'Email List A (Dedicated)',
        type: 'EMAIL',
        totalCapacity: 4,
        unit: 'slots'
    },
    {
        id: 'email-list-b',
        name: 'Email List B (Dedicated)',
        type: 'EMAIL',
        totalCapacity: 4,
        unit: 'slots'
    },
    {
        id: 'email-daily',
        name: 'Daily Newsletters',
        type: 'EMAIL',
        totalCapacity: 90, // Approx 3 emails * 30 days
        unit: 'slots'
    }
];

// Geo-targeting "cost" factors or splits
// This is a simplification: If you book UK, maybe it only consumes "UK inventory".
// For V1, we might assume Global = 100% capacity, UK = 70% of Global, US = 20% of Global.
export const GEO_DISTRIBUTION = {
    GLOBAL: 1.0,
    UK: 0.7,
    US: 0.2,
    UK_WALES: 0.05,
    UK_SCOTLAND: 0.08,
    UK_NI: 0.03,
    UK_LONDON: 0.15
};
