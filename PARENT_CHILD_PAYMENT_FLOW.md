# Parent Child Payment Flow Documentation

## Overview
This document describes the implemented parent child addition and payment flow for Heritage Club.

## Features Implemented

### 1. Dedicated Child Addition Page
**Location:** `/dashboard/parent/children/add`

**Features:**
- Separate from the main enrollment flow
- Designed for existing parents who want to add additional children
- Two-step process: Child Details → Review & Payment
- Automatically calculates pricing based on existing children count
- Shows sibling discounts dynamically

**Pricing Logic:**
- Base price: $70 CAD
- 2nd child: $70 - $10 = $60 CAD
- 3rd child: $70 - $5 = $65 CAD  
- 4th+ child: $70 - $5 = $65 CAD

### 2. Updated Parent Children Page
**Location:** `/dashboard/parent/children`

**Changes:**
- "Add a child" button now links to `/dashboard/parent/children/add` instead of `/enroll`
- Maintains existing child management functionality
- Shows all children with their status and progress

### 3. Individual Child Payments Display
**Locations:** 
- `/dashboard/parent/subscription` - Shows individual child payments section
- `/dashboard/parent/payments` - Full payment history with child names

**Features:**
- Distinguishes between subscription payments and individual child payments
- Shows child name for each individual payment
- Displays payment type (Subscription vs Individual Child)
- Shows payment status and amounts

### 4. Payment Type Tracking
**Database Changes:**
- Added `paymentType` field to Payment model ('subscription' | 'individual_child')
- Added `paymentType` to payment metadata
- Updated all payment creation and retrieval logic

**API Enhancements:**
- `/api/parent/payments` - Returns enhanced payment data with child information
- `/api/parent` - Returns payments with child details in dashboard data
- `/api/parent/children` - Creates individual child payments with proper type

### 5. Payment Callback Improvements
**Location:** `/payment/callback`

**Changes:**
- Detects child payments via URL parameter `?type=child`
- Redirects to `/dashboard/parent/children` after successful child payment
- Redirects to appropriate dashboard based on user role
- Shows appropriate success messages

## Payment Flow Architecture

### Initial Enrollment Flow (New Parents)
1. Parent goes to `/enroll`
2. Chooses "Parent or guardian" flow
3. Enters parent account details
4. Adds children with their information
5. Selects plan based on total children count
6. Creates subscription payment
7. Redirects to Paystack for payment
8. Callback verifies and activates account
9. Redirects to parent dashboard

### Additional Child Addition Flow (Existing Parents)
1. Parent goes to `/dashboard/parent/children`
2. Clicks "Add a child" button
3. Redirects to `/dashboard/parent/children/add`
4. Enters new child details (name, email, password, age, etc.)
5. System calculates price based on existing children count
6. Shows review with pricing breakdown
7. Creates individual child payment record
8. Redirects to Paystack for payment
9. Callback verifies and activates child account
10. Redirects to `/dashboard/parent/children`

## API Endpoints

### Child Addition
- `POST /api/parent/children` - Creates new child and initiates payment
- `GET /api/parent/children` - Lists all children

### Payment Management
- `GET /api/parent/payments` - Lists all payments with child details
- `GET /api/parent` - Dashboard data including payments
- `POST /api/payments/paystack/initialize` - Initialize payment
- `POST /api/payments/paystack/verify` - Verify payment completion

## Database Schema Changes

### Payment Model
```typescript
{
  paymentType?: 'subscription' | 'individual_child'  // NEW
  metadata?: {
    studentId?: string  // For child payments
    parent?: string
    paymentType?: string  // Additional tracking
  }
}
```

### User Model (Child)
```typescript
{
  status: 'pending_payment' | 'active'  // Children start as pending_payment
  parent: ObjectId  // Reference to parent account
}
```

## Testing Checklist

### Child Addition Flow
- [ ] Parent can access `/dashboard/parent/children/add`
- [ ] Form validates all required fields correctly
- [ ] Pricing calculates correctly based on existing children
- [ ] Review page shows accurate information
- [ ] Payment initializes with correct amount
- [ ] Child account created with `pending_payment` status
- [ ] Payment record created with `individual_child` type

### Payment Processing
- [ ] Paystack redirect works correctly
- [ ] Payment callback handles child payments
- [ ] Child status changes to `active` after successful payment
- [ ] Parent receives notification of successful payment
- [ ] Redirect goes to children page after child payment

### Payment Display
- [ ] Individual child payments appear in subscription page
- [ ] Child names display correctly in payment history
- [ ] Payment types are properly distinguished
- [ ] Payment amounts and currencies are accurate
- [ ] Invoice numbers are generated correctly

### Edge Cases
- [ ] Multiple children added in sequence
- [ ] Failed payment scenarios
- [ ] Duplicate email/username handling
- [ ] Age validation (3-19 years)
- [ ] Payment callback with missing parameters

## Error Handling

### Common Scenarios
1. **Payment initialization fails**: Child account is cleaned up, error shown to user
2. **Payment verification fails**: Payment marked as failed, child remains pending
3. **Duplicate email**: Error shown before payment initiation
4. **Invalid age**: Validation error shown on form
5. **Paystack not configured**: Simulation mode activated for development

## Security Considerations

- Payment references are unique and cryptographically generated
- Child accounts created only after successful payment
- Sensitive payment data stored securely in metadata
- Callback URL includes type parameter for proper routing
- Parent authentication required for all child operations

## Future Enhancements

Potential improvements for the system:
1. Bulk child addition (multiple children at once)
2. Payment plans for individual children (monthly vs one-time)
3. Child transfer between parent accounts
4. Payment history export
5. Receipt generation for individual child payments
6. proration for mid-period additions
7. Family plan upgrades/downgrades

## Notes

- The pricing logic uses sibling discounts that increase with family size
- All individual child payments are tracked separately from subscription payments
- The system maintains backward compatibility with existing subscription flows
- Child accounts remain in `pending_payment` status until payment is verified
- Parents can manage children independently from their main subscription
