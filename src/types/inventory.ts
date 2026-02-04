export type MediaType = 'AUDIO' | 'DISPLAY' | 'EMAIL';

export type GeoRegion = 'GLOBAL' | 'US' | 'UK' | 'UK_WALES' | 'UK_SCOTLAND' | 'UK_NI' | 'UK_LONDON';

// Base inventory definition
export interface InventoryItem {
    id: string;
    name: string;
    type: MediaType;
    totalCapacity: number; // e.g., 500,000
    unit: string; // 'downloads', 'streams', 'impressions', 'slots'
}

// A generic booking request
export interface BookingRequest {
    id: string;
    clientName: string;
    campaignName: string;
    startDate: string; // ISO Date
    endDate: string; // ISO Date

    // New Fields
    contractNumber?: string;
    bookerName?: string;
    bookingType?: string; // 'AUDIO', 'DISPLAY', 'BESPOKE_ESEND', 'ADS_IN_ESEND'
    department?: string; // 'SALES', 'MARKETING', 'FUNDRAISING', 'INTERNAL'
    additionalDetails?: any; // Flexible JSON object

    // Specific requests
    audioSpots?: number;
    audioTargetId?: string; // e.g. 'audio-podcast-unbelievable' or empty for 'Run of Network'
    displayImpressions?: number;
    emailDates?: string[]; // Array of dates for emails

    geoTarget: GeoRegion;
    status: 'DRAFT' | 'CONFIRMED';
}

// Data structure for the Context
export interface AppState {
    bookings: BookingRequest[];
    addBooking: (booking: BookingRequest) => void;
    getAvailability: (type: MediaType, startDate: string, endDate: string, targetId?: string) => number;
}
