# ShopExpo

## Current State

ShopExpo is a full-stack e-commerce app with:
- Internet Identity authentication
- Product catalog with categories, search, image upload
- Shopping cart and order management
- Stripe + Sky Pay checkout
- Admin dashboard with PIN lock (PIN: 0078, backend setup PIN: 1234)
- User management, reviews, wishlists, coupons, address book, order cancel/return, sales analytics, banner management, FAQ, terms/privacy pages
- All 18 categories pre-loaded

**Known admin dashboard errors:**
1. `getCallerUserProfile` traps for admin users who haven't registered as `#user` role — because it checks `#user` permission only, not admin
2. `saveCallerUserProfile` similarly traps for pure admin users
3. `getAllUsers` only returns users who have profiles — admin-only users (no profile) are missing
4. These cause crashes when admin tries to view their profile or the users tab

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `getCallerUserProfile`: allow callers who are admin OR user (not just user)
- `saveCallerUserProfile`: allow callers who are admin OR user (not just user)
- `getAllUsers`: include admin-only principals who haven't saved a profile (show them with null profile, role "admin")

### Remove
- Nothing

## Implementation Plan

1. Fix `getCallerUserProfile` — change permission check to allow both `#user` and `#admin` roles
2. Fix `saveCallerUserProfile` — same fix
3. Fix `getAllUsers` — after building profileUsers array, also iterate `accessControlState.userRoles` to find admins not in userProfiles, append them with `profile = null`
