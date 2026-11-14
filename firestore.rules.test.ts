/**
 * Firestore Security Rules Test Specification (Dirty Dozen Adversarial Suite)
 * Verifies that all 12 unauthorized / malformed payloads return PERMISSION_DENIED.
 */
export const dirtyDozenSecurityCases = [
  { name: 'Unauthenticated Read', path: '/users/uid_1', auth: null, op: 'get', expected: 'PERMISSION_DENIED' },
  { name: 'Unverified Email Spoof', path: '/users/uid_1', auth: { uid: 'uid_1', token: { email_verified: false } }, op: 'create', expected: 'PERMISSION_DENIED' },
  { name: 'Cross-User PII Read', path: '/users/uid_1/private/info', auth: { uid: 'uid_2', token: { email_verified: true } }, op: 'get', expected: 'PERMISSION_DENIED' },
  { name: 'Shadow Field Injection', path: '/users/uid_1', auth: { uid: 'uid_1', token: { email_verified: true } }, op: 'create', data: { isAdmin: true }, expected: 'PERMISSION_DENIED' },
  { name: 'Identity Spoofing on Task', path: '/users/uid_1/tasks/t1', auth: { uid: 'uid_1', token: { email_verified: true } }, op: 'create', data: { ownerId: 'uid_2' }, expected: 'PERMISSION_DENIED' },
  { name: 'Orphaned Task Write', path: '/users/uid_missing/tasks/t1', auth: { uid: 'uid_missing', token: { email_verified: true } }, op: 'create', expected: 'PERMISSION_DENIED' },
  { name: 'Timestamp Forgery', path: '/users/uid_1/tasks/t1', auth: { uid: 'uid_1', token: { email_verified: true } }, op: 'create', data: { createdAt: 'client-time' }, expected: 'PERMISSION_DENIED' },
  { name: 'Immutable Field Mutation', path: '/users/uid_1/tasks/t1', auth: { uid: 'uid_1', token: { email_verified: true } }, op: 'update', data: { ownerId: 'uid_2' }, expected: 'PERMISSION_DENIED' },
  { name: 'Value Type Poisoning', path: '/users/uid_1/tasks/t1', auth: { uid: 'uid_1', token: { email_verified: true } }, op: 'update', data: { priority: 'SUPER_ADMIN' }, expected: 'PERMISSION_DENIED' },
  { name: 'ID Poisoning (>128 chars)', path: `/users/uid_1/tasks/${'a'.repeat(130)}`, auth: { uid: 'uid_1', token: { email_verified: true } }, op: 'create', expected: 'PERMISSION_DENIED' },
  { name: 'Array Exhaustion on Alarm', path: '/users/uid_1/alarms/a1', auth: { uid: 'uid_1', token: { email_verified: true } }, op: 'create', data: { days: new Array(20).fill(1) }, expected: 'PERMISSION_DENIED' },
  { name: 'Blanket List Query Scraping', path: '/users/uid_1/tasks', auth: { uid: 'uid_2', token: { email_verified: true } }, op: 'list', expected: 'PERMISSION_DENIED' },
];
