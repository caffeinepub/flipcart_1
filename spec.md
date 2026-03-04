# ShopExpo

## Current State
Full e-commerce app with products, categories, cart, orders, payments (Stripe + Sky Pay), admin dashboard with PIN lock, user management, analytics, banners, wishlist, reviews, coupons, FAQ, Terms & Privacy pages.

Admin setup uses `initializeFirstAdmin(pin)` backend function. Current issues:
- Backend `SETUP_PIN = "1234"` hardcoded but should be `"0078"` to match frontend
- Backend uses `Runtime.trap("Admin already initialized...")` which causes unhandled errors in frontend
- Frontend `BACKEND_SETUP_PIN = "1234"` needs to match backend PIN

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Backend `initializeFirstAdmin`: Change `SETUP_PIN` from `"1234"` to `"0078"`, replace `Runtime.trap("Admin already initialized...")` with `return false` (graceful non-trap response), ensure caller-already-admin check always returns `true` without errors
- Frontend `AdminPage.tsx`: Change `BACKEND_SETUP_PIN` from `"1234"` to `"0078"`, update error handling to handle `false` return value (admin already taken), improve error messaging so users always know what to do

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend Motoko with fixed `initializeFirstAdmin` logic: PIN `"0078"`, no trap on already-initialized (return false instead), caller-already-admin returns true
2. Update frontend AdminPage: change BACKEND_SETUP_PIN to "0078", handle false return (show "contact existing admin" message), remove dependency on error message string matching
