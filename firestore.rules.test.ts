/**
 * Security Rules Verification Suite (Phase 0 TDD)
 * Documents the 12 adversarial payloads ("Dirty Dozen") that firestore.rules must reject.
 */

export interface AdversarialCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  actorUid: string;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
  enforcedBy: string;
}

export const DIRTY_DOZEN_CASES: AdversarialCase[] = [
  {
    id: 1,
    name: 'Cross-Tenant Profile Read',
    operation: 'get',
    path: '/users/userA',
    actorUid: 'userB',
    emailVerified: true,
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isOwner(userId)',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    operation: 'create',
    path: '/users/userA/notes/note1',
    actorUid: 'userA',
    emailVerified: false,
    payload: { title: 'Test', content: 'Unverified write' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isVerifiedUser()',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Create',
    operation: 'create',
    path: '/users/userA',
    actorUid: 'userA',
    emailVerified: true,
    payload: {
      uid: 'userA',
      displayName: 'User A',
      email: 'a@example.com',
      theme: 'light',
      arabicFontSize: 'md',
      qariId: '05',
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidUserProfile() keys().hasOnly(...)',
  },
  {
    id: 4,
    name: 'Identity Spoofing on Subcollection',
    operation: 'create',
    path: '/users/userA/bookmarks/bm1',
    actorUid: 'userA',
    emailVerified: true,
    payload: {
      userId: 'userB',
      type: 'quran',
      refKey: 'quran:2:153',
    },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidBookmark() data.userId == request.auth.uid',
  },
  {
    id: 5,
    name: 'ID Poisoning',
    operation: 'create',
    path: '/users/userA/folders/bad$id!chars',
    actorUid: 'userA',
    emailVerified: true,
    payload: { userId: 'userA', name: 'Hafalan', description: '' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidId(folderId)',
  },
  {
    id: 6,
    name: 'Orphaned Subcollection Write',
    operation: 'create',
    path: '/users/userA/folders/f1',
    actorUid: 'userA',
    emailVerified: true,
    payload: { userId: 'userA', name: 'Doa Harian', description: '' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'hasParentUser(userId) Master Gate exists()',
  },
  {
    id: 7,
    name: 'Client Timestamp Tampering',
    operation: 'create',
    path: '/users/userA/notes/n1',
    actorUid: 'userA',
    emailVerified: true,
    payload: {
      userId: 'userA',
      title: 'Tadabbur',
      content: 'Forged timestamp',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().createdAt == request.time',
  },
  {
    id: 8,
    name: 'Immutable Field Mutation',
    operation: 'update',
    path: '/users/userA/bookmarks/bm1',
    actorUid: 'userA',
    emailVerified: true,
    payload: { refKey: 'quran:1:1', type: 'hadith' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'affectedKeys().hasOnly(...) and immutable equality checks',
  },
  {
    id: 9,
    name: 'Value Poisoning on Allowed Key',
    operation: 'update',
    path: '/users/userA/notes/n1',
    actorUid: 'userA',
    emailVerified: true,
    payload: { title: true },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidNote(incoming()) wraps update block',
  },
  {
    id: 10,
    name: 'Array Flood / Unbounded Tags',
    operation: 'create',
    path: '/users/userA/notes/n2',
    actorUid: 'userA',
    emailVerified: true,
    payload: {
      userId: 'userA',
      title: 'Flood',
      content: 'Too many tags',
      tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'data.tags.size() <= 8',
  },
  {
    id: 11,
    name: 'Blanket Collection Listing',
    operation: 'list',
    path: '/users/userA/bookmarks',
    actorUid: 'userB',
    emailVerified: true,
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isOwner(userId) && resource.data.userId == request.auth.uid',
  },
  {
    id: 12,
    name: 'Profile Role Escalation Update',
    operation: 'update',
    path: '/users/userA',
    actorUid: 'userA',
    emailVerified: true,
    payload: { role: 'admin' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'affectedKeys().hasOnly(["displayName","photoURL","theme","arabicFontSize","qariId","updatedAt"])',
  },
];
