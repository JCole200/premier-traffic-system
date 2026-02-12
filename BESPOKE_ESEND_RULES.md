# Bespoke E-Send Booking Rules

## Current Implementation Status

### ✅ Implemented Rules

#### 1. No Sunday Bookings
- **Status:** ✅ Fully Implemented
- **Location:** `src/lib/limits.ts` (lines 21-26)
- **Behavior:** System rejects any booking attempt that includes a Sunday date
- **Error Message:** "Bookings are not allowed on Sundays (date)."

#### 2. Sales Weekly Limit (2 per week)
- **Status:** ✅ Fully Implemented
- **Location:** `src/lib/limits.ts` (lines 54-108)
- **Behavior:** 
  - Sales department limited to 2 bespoke e-sends per week
  - Week runs Monday-Sunday
  - System counts existing bookings + new request
- **Error Message:** "Sales limited to 2 E-sends per week. week of [date] already has [count]."

#### 3. Department Exclusivity
- **Status:** ✅ Fully Implemented
- **Location:** `src/lib/limits.ts` (lines 28-51)
- **Behavior:**
  - If Marketing books a date, Sales cannot book that same date
  - If Fundraising books a date, Sales cannot book that same date
  - Vice versa applies
- **Error Message:** "Date [date] is already booked by [department]. Sales and Marketing/Fundraising cannot book the same day."

#### 4. Monthly List Limits
- **Status:** ✅ Fully Implemented
- **Location:** `src/lib/limits.ts` (lines 110-165)
- **Lists with 1/month limit:**
  - Marketplace
  - Jobsearch
  - Magazines
  - Impact/Fundraising
  - E-appeal
  - United Prayer
- **Behavior:** Each of these lists can only be used once per calendar month
- **Error Message:** "List '[name]' is limited to 1 send per month. Already booked in [month]."

### ⚠️ Partially Implemented

#### 5. Blocked Periods (Christmas, Easter, EOFY, etc.)
- **Status:** ⚠️ Infrastructure exists, needs annual configuration
- **Location:** Admin Dashboard → "Block Out Dates" section
- **How to Use:**
  1. Login to `/admin` (username: admin, password: admin123)
  2. Navigate to "Block Out Dates" section
  3. Select booking type (Bespoke E-sends)
  4. Select dates to block
  5. Add reason (e.g., "Christmas Period", "EOFY Appeal")
  6. Save
- **Recommendation:** Block dates at end of each year for the following year

**Typical Blocked Periods:**
- Christmas: ~Dec 20 - Jan 5
- Easter: Variable (check calendar each year)
- EOFY (End of Financial Year): Late June
- EOY (End of Year): November-December
- September Fundraising: Specific dates TBD

### ❌ Not Yet Implemented

#### 6. Per-List Visual Calendar
- **Status:** ❌ Not Implemented
- **Current Behavior:** Calendar shows aggregate availability across all lists
- **Requested Behavior:** 
  - Show availability for each specific list
  - Sales team makes decisions based on which lists are available on which dates
- **Complexity:** High - requires significant calendar component refactoring

#### 7. Two-Tab Calendar View (Premier vs Regular)
- **Status:** ❌ Not Implemented
- **Requested Behavior:**
  - Tab 1: "Premier" (internal marketing/fundraising, smaller lists)
  - Tab 2: "Sales" (client bookings, main lists)
- **Complexity:** Medium - requires UI changes to calendar component

## Available Lists

### Sales Lists (Main)
- SALES A+B
- SALES A
- SALES B
- SALES CTY

### Sales Lists (Additional)
- SALES NEXGEN
- SALES LEADERS
- SALES WAlive
- SALES PG

### Other Lists (1/month limit)
- FUNDRAISING
- MARKETING
- Marketplace
- Jobsearch
- Magazines
- Impact/Fundraising
- E-appeal
- United Prayer

### Custom
- Other (describe)

## Booking Fields

### All Bookings Include:
- Booked by (Premier team member name or "House")
- Client name
- Contract number
- Campaign details
- Selected dates
- Selected lists

### Marketing/Fundraising Bookings:
- Simplified fields (don't need all client details)
- Focus on dates and purpose

## Recommendations for Admin

### Annual Tasks (End of Year)
1. Review and update blocked dates for next year
2. Block Christmas period
3. Block Easter period (check calendar)
4. Block EOFY period
5. Block EOY fundraising period
6. Block September fundraising period
7. Block any known appeal dates

### Weekly Tasks
1. Review calendar for conflicts
2. Ensure no department clashes
3. Monitor sales weekly limits

### As-Needed
1. Block dates during active appeals
2. Adjust for special campaigns
3. Communicate blocked periods to sales team

## Future Enhancements

### Priority 1: Per-List Calendar View
**Why:** Sales team needs to see which specific lists are available
**Implementation:** 
- Add list selector to calendar
- Filter availability by selected list
- Show color coding per list

### Priority 2: Two-Tab Calendar
**Why:** Separate internal (Premier) from external (Sales) bookings
**Implementation:**
- Add tab switcher to calendar
- Filter by department
- Different visual styling per tab

### Priority 3: Appeal Integration
**Why:** Automatically block dates during appeals
**Implementation:**
- Add "Appeal" booking type
- Auto-block bespoke e-sends when appeal is active
- Visual indicator on calendar

## Technical Notes

### Validation Flow
1. User selects dates in calendar
2. User selects lists
3. On form submission, `validateBookingRules()` is called
4. System checks all rules in order:
   - Sunday check
   - Department exclusivity
   - Weekly limits (for Sales)
   - Monthly limits (for restricted lists)
5. If any rule fails, booking is rejected with specific error
6. If all pass, booking is created

### Database Schema
- Bookings stored in `Booking` table
- `emailDates`: JSON array of date strings
- `department`: SALES, MARKETING, FUNDRAISING, INTERNAL
- `additionalDetails`: JSON object with lists and other metadata
- `isBlocked`: Boolean flag for admin-blocked dates

### Performance Considerations
- Current implementation fetches all bookings and filters in-memory
- Works well for current scale (hundreds of bookings)
- May need optimization if scale grows to thousands
- Consider adding database indexes on `department` and `bookingType`
