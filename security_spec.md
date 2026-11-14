# Pluto OS Firestore Security Specification

## 1. Data Invariants
1. **Default Deny Catch-All:** Every unmatched Firestore path is denied (`allow read, write: if false;`).
2. **Verified Identity:** Every read/write requires `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation:** Sensitive fields (`email`, `twoFactorEnabled`) are isolated under `/users/{userId}/private/info` and strictly readable/writable only by the owning user.
4. **Master Gate Parent Integrity:** Every document inside subcollections (`/tasks`, `/alarms`, `/cloud_files`) requires the parent `/users/{userId}` document to exist and match `request.auth.uid`.
5. **Immutable Identity & Server Timestamps:** `uid`, `ownerId`, `id`, and `createdAt` cannot be modified after creation; `createdAt` and `updatedAt` must equal `request.time`.
6. **Strict Key & Size Enforcement:** Every `create` uses `hasAll()` + `hasOnly()` matching `firebase-blueprint.json`, every `update` is wrapped in the entity's `isValid*` helper and `affectedKeys().hasOnly(...)`, and every string/list enforces strict `.size()` bounds.

## 2. "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Read:** `GET /users/uid_1` with `auth: null` -> DENIED.
2. **Unverified Email Spoof:** `CREATE /users/uid_1` with `email_verified: false` -> DENIED.
3. **Cross-User PII Read:** `GET /users/uid_1/private/info` as `uid_2` -> DENIED.
4. **Shadow Field Injection on Profile:** `CREATE /users/uid_1` with extra field `isAdmin: true` -> DENIED.
5. **Identity Spoofing on Task:** `CREATE /users/uid_1/tasks/t1` with `ownerId: "uid_2"` -> DENIED.
6. **Orphaned Task Write:** `CREATE /users/uid_1/tasks/t1` when `/users/uid_1` does not exist -> DENIED.
7. **Timestamp Forgery:** `CREATE /users/uid_1/tasks/t1` with custom `createdAt` != `request.time` -> DENIED.
8. **Immutable Field Mutation:** `UPDATE /users/uid_1/tasks/t1` modifying `ownerId` or `createdAt` -> DENIED.
9. **Value Type Poisoning:** `UPDATE /users/uid_1/tasks/t1` setting `priority: "SUPER_ADMIN"` (invalid enum) -> DENIED.
10. **ID Poisoning:** `CREATE /users/uid_1/tasks/../../../hack` or >128 char ID -> DENIED.
11. **Array Exhaustion on Alarm:** `CREATE /users/uid_1/alarms/a1` with `days` array length 50 -> DENIED.
12. **Blanket List Query Scraping:** `LIST /users/uid_1/tasks` queried by `uid_2` -> DENIED.
