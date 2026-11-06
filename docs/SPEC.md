# Security Rules Specification

Write the rules in `firestore.rules` and `storage.rules` so that every test in `test/` passes. The tests are the source of truth; this document explains the intent.

## Roles

| Role | How it is identified |
|---|---|
| Anonymous | `request.auth == null` |
| User | Signed in. The uid is `request.auth.uid`. |
| Admin | Signed in with the custom claim `admin == true` in `request.auth.token`. |

## Firestore

### users/{uid}

Fields: `displayName` (string), `role` (string), `pointsBalance` (number), optional `createdAt`.

| Action | Who | Conditions |
|---|---|---|
| Read | The owner, or an admin | |
| Create | The owner only | Only the keys `displayName`, `role`, `createdAt` are allowed. `role` must equal `"user"`. `displayName` must be a string of 1 to 60 characters. `pointsBalance` must not be present. |
| Update | The owner only | Only `displayName` may change, and it must remain a valid string of 1 to 60 characters. |
| Delete | Nobody | |

Why: `pointsBalance` and `role` are controlled by trusted server code (for example a Cloud Function). A client must never be able to change them, otherwise any user could give themselves points or become an admin.

### users/{uid}/tasks/{taskId}

Fields: `title` (string), `done` (boolean).

| Action | Who | Conditions |
|---|---|---|
| Read | The owner | |
| Create | The owner | Only the keys `title` and `done`. `title` is a string of 1 to 60 characters. `done` is a boolean. |
| Update | The owner | The resulting document must satisfy the same conditions as create. |
| Delete | The owner | |

### appConfig/{docId}

| Action | Who |
|---|---|
| Read | Any signed-in user |
| Write | Admin only |

### Everything else

Denied.

## Storage

### users/{uid}/avatar/{fileName}

| Action | Who | Conditions |
|---|---|---|
| Read | The owner, or an admin | |
| Create / update | The owner only | File size is at most 2 MB (2 * 1024 * 1024 bytes). Content type is `image/jpeg` or `image/png`. |
| Delete | The owner only | |

### Everything else

Denied.

## Working method

1. Run `npm test` and observe the failing tests.
2. Complete `isOwner` and `isAdmin`.
3. Work through one collection at a time, re-running the tests after each change.
4. When all tests pass, read your rules once more and ask: "Could any user do something I did not intend?" Write one extra test of your own that tries to break your rules.
