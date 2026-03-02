# FlipCart

## Current State
- Full e-commerce app with products, cart, checkout, orders, reviews
- Authorization component is integrated (MixinAuthorization)
- Backend has `assignCallerUserRole`, `getCallerUserRole`, `isCallerAdmin` functions
- Admin Dashboard (AdminPage) requires admin role AND 4-digit PIN (1234)
- No way for first user to become admin — `assignCallerUserRole` requires calling user to be admin already
- Account page shows "Admin access chahiye? App owner se contact karein" message for non-admins

## Requested Changes (Diff)

### Add
- "Initialize Admin" flow: if no admin exists yet, the first logged-in user who visits the Admin page can claim admin privileges by entering the 4-digit PIN (1234). This acts as a bootstrap mechanism.
- New backend query `useGetCallerUserRole` hook already exists — use it.
- On AdminPage: before showing "Access Denied", check if caller is not admin but PIN screen not verified; if so, show "Claim Admin" option with PIN entry that calls `assignCallerUserRole` on success.
- More specifically: add a `claimAdminIfNoneExists` path — when user is logged in but not admin, show a special "Setup Admin Access" card with PIN entry. On correct PIN, call `assignCallerUserRole` with caller's principal and `admin` role, then re-check admin status.

### Modify
- AdminPage: Add a "Claim Admin" flow — when user is logged in but not admin, instead of just "Access Denied", show a card offering to claim admin if PIN is correct.
- The hook `useAssignCallerUserRole` is already in useQueries.ts but needs to be wired up in AdminPage.

### Remove
- Nothing removed.

## Implementation Plan
1. In AdminPage.tsx, modify the `!isAdmin` block to show a "Claim Admin Access" UI with PIN entry
2. On correct PIN entry in this claim flow, call `assignCallerUserRole` with the current user's principal and `UserRole.admin`
3. After successful role assignment, invalidate the isAdmin query so the page re-renders with admin access
4. Show appropriate success/error toast messages
