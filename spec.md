# ShopExpo

## Current State
Full-featured e-commerce app with Header, Footer, routing via TanStack Router, and pages for Home, Products, Cart, Checkout, Orders, Account, Admin, Wishlist, FAQ, Terms, Privacy, Forgot/Reset Password. No bottom navigation, no onboarding screens, no protected route middleware.

## Requested Changes (Diff)

### Add
- **Bottom Navigation Bar** (mobile only, `sm:hidden`): Fixed bottom bar with 5 tabs -- Home, Categories, Cart, Orders, Account. Show cart item count badge on Cart tab. Active tab highlighted. Hides on desktop.
- **Onboarding Screen**: 3-slide welcome walkthrough shown only on first visit. Slides cover: (1) Welcome to ShopExpo, (2) Browse thousands of products, (3) Fast delivery & easy returns. Skip button and Next/Get Started button. Stored in localStorage (`shopexpo_onboarding_done`) so it shows only once.
- **Route Middleware (Protected Routes)**: Cart, Checkout, Orders, Wishlist, Account routes redirect to `/account` (login page) if user is not authenticated. Admin route redirects non-admins to home.

### Modify
- `App.tsx`: Add `beforeLoad` guards on protected routes (cart, checkout, orders, wishlist, account, admin). Wrap root layout to show onboarding overlay on first visit. Add bottom nav component.
- `Header.tsx`: Add bottom padding on mobile to account for bottom nav bar height (pb-16 on main content area).

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/components/OnboardingScreen.tsx` -- 3-slide carousel onboarding with localStorage check.
2. Create `src/components/layout/BottomNav.tsx` -- fixed bottom nav with Home, Categories, Cart, Orders, Account tabs and cart badge.
3. Update `App.tsx` -- add bottom nav to root layout, add onboarding overlay, add `beforeLoad` guards for protected routes.
4. Add `pb-16 sm:pb-0` to main content area so bottom nav doesn't overlap content on mobile.
