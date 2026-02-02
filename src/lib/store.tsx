'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BookingRequest, AppState, MediaType } from '../types/inventory';
import { INVENTORY_BASELINES } from './constants';

const InventoryContext = createContext<AppState | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
    const [bookings, setBookings] = useState<BookingRequest[]>([]);

    const addBooking = (booking: BookingRequest) => {
        setBookings((prev) => [...prev, booking]);
    };

    // Simple availability calculator (Mock logic for now)
    // In a real app, this would check overlapping dates and sum up booked amounts.
    // Updated availability calculator handling both Types (Aggregate) and specific Items
    const getAvailability = (type: MediaType, startDate: string, endDate: string, targetId?: string) => {
        let baseline = 0;

        if (targetId) {
            // Specific Item Check
            const item = INVENTORY_BASELINES.find(i => i.id === targetId);
            baseline = item ? item.totalCapacity : 0;
        } else {
            // Aggregate Type Check
            baseline = INVENTORY_BASELINES.filter(i => i.type === type).reduce((acc, curr) => acc + curr.totalCapacity, 0);
        }

        const booked = bookings
            .filter(b => b.status === 'CONFIRMED')
            // TODO: Add thorough date overlap logic
            .reduce((acc, curr) => {
                // Logic:
                // If checking specific targetId: count bookings that match this targetId OR are "Run of Network" (no targetId)?
                // User requirement: "Book unique podcast OR impact overall".
                // Simplest interpretation:
                // 1. "Run of Network" (no targetId) counts against the Aggregate Total.
                // 2. Focused Booking (targetId) counts against the Spcific Item AND aggregate total.
                // 3. Does "Run of Network" reduce availability of "Unbelievable"?
                //    Technically yes, but for MVP let's keep them somewhat distinct unless we implement dynamic allocation.
                //    Current Logic: 
                //      - If I ask for Available(Unbelievable): Show Capacity(Unbelievable) - Bookings(Unbelievable).
                //      - If I ask for Available(Audio Total): Show Capacity(Audio Total) - Bookings(All Audio).

                if (targetId) {
                    if (curr.audioTargetId === targetId) return acc + (curr.audioSpots || 0);
                    return acc;
                }

                // Aggregate calculation
                if (type === 'AUDIO') return acc + (curr.audioSpots || 0);
                if (type === 'DISPLAY') return acc + (curr.displayImpressions || 0);
                if (type === 'EMAIL') return acc + (curr.emailDates?.length || 0);
                return acc;
            }, 0);

        return baseline - booked;
    };

    return (
        <InventoryContext.Provider value={{ bookings, addBooking, getAvailability }}>
            {children}
        </InventoryContext.Provider>
    );
}

export function useInventory() {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
