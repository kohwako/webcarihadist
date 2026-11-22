# Security Specification — QUR'AN & HADIS Firestore Rules

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: Every user profile (`/users/{userId}`) and all subcollections (`folders`, `bookmarks`, `notes`, `searchHistory`) belong strictly to `{userId}` where `request.auth.uid == userId`. No user can read, list, create, update, or delete another user's documents.
2. **Verified Identity**: All writes require an authenticated user with `request.auth.token.email_verified == true`.
3. **Master Gate Parent Sync**: Every subcollection write (`folders`, `bookmarks`, `notes`, `searchHistory`) verifies that the parent `/users/{userId}` document exists (`exists(/databases/$(database)/documents/users/$(userId))`).
4. **Immutable Ownership & Timestamps**: `uid` / `userId`, `createdAt`, `type`, and `refKey` are strictly immutable after creation. All `createdAt` and `updatedAt` timestamps must strictly equal `request.time`.
5. **Path Variable Hardening & Payload Bounds**: Every document ID matches `^[a-zA-Z0-9_\-]+$` with length `<= 128`. Every string field has an explicit `.size()` upper bound matching `firebase-blueprint.json`, and every array (`tags`) is strictly capped (`size() <= 8`) with element type checks.
6. **Zero Shadow Fields**: All `create` operations enforce `keys().hasAll(...) && keys().hasOnly(...)`, and all `update` operations wrap `isValid[Entity](incoming())` and use action-based `incoming().diff(existing()).affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Cross-Tenant Profile Read**: User B attempts `get` on `/users/userA`.
2. **Unverified Email Write**: User A with `email_verified: false` attempts to create `/users/userA/notes/note1`.
3. **Shadow Field Injection on Create**: User A attempts to create `/users/userA` with extra ghost field `isAdmin: true`.
4. **Identity Spoofing on Subcollection**: User A attempts to create `/users/userA/bookmarks/bm1` with `userId: "userB"`.
5. **ID Poisoning**: User A attempts to create `/users/userA/folders/invalid$id!with..chars` or a 300-character ID.
6. **Orphaned Subcollection Write**: User A attempts to create `/users/userA/folders/f1` before parent `/users/userA` exists.
7. **Client Timestamp Tampering**: User A attempts to create `/users/userA/notes/n1` with a forged `createdAt` timestamp instead of `request.time`.
8. **Immutable Field Mutation**: User A attempts to update `/users/userA/bookmarks/bm1` to alter `refKey` or `type` or `createdAt`.
9. **Value Poisoning on Allowed Key**: User A attempts to update `/users/userA/notes/n1` setting `title` to a boolean `true` or a 500-character string.
10. **Array Flood / Unbounded Tags**: User A attempts to create `/users/userA/notes/n2` with `tags` containing 15 strings (`> 8`).
11. **Blanket Collection Listing**: User B attempts `list` on `/users/userA/bookmarks` without owning `{userId}`.
12. **Profile Role Escalation Update**: User A attempts to update `/users/userA` adding `role: "admin"` via an unallowed key.
