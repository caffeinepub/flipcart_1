# FlipCart

## Current State
E-commerce app with Stripe payment integration on the CheckoutPage. Users can fill address details and pay via Stripe (credit/debit card). There is a single "Pay" button that redirects to Stripe checkout.

## Requested Changes (Diff)

### Add
- "Sky Pay" as an additional payment method option on the CheckoutPage
- Payment method selector UI with two options: Sky Pay and Card (Stripe)
- Sky Pay flow: simulated UPI-style payment that places the order directly (no external redirect), shows a mock Sky Pay UI with UPI ID input or QR code display, then confirms order

### Modify
- CheckoutPage: Add payment method selection step before the Pay button
- When Sky Pay is selected, show a Sky Pay branded payment UI (UPI ID field or "Pay via Sky Pay" button)
- When Card is selected, proceed with existing Stripe flow
- Pay button label changes based on selected method

### Remove
- Nothing removed; Stripe remains as default option

## Implementation Plan
1. Add payment method toggle (Sky Pay vs Card/Stripe) in the right-side summary card
2. Sky Pay selected: show a UPI ID input field and a "Pay with Sky Pay" button that simulates payment and places the order directly
3. Card selected: existing Stripe checkout flow unchanged
4. Add Sky Pay logo/branding (sky blue color scheme with "SKY PAY" text badge)
5. Sky Pay success: show same order confirmation screen as Stripe success
