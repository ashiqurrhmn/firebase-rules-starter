# Firebase Security Rules Starter

Week 1 exercise: write Firestore and Cloud Storage security rules until every automated test passes.

## What you will learn

- How Firebase security rules are structured and evaluated
- Authentication checks and role checks using custom claims
- Protecting server-controlled fields from client writes
- Input validation inside rules (field names, types, length, file size, content type)
- Testing rules locally with the Firebase Emulator Suite

## Prerequisites

- Node.js 20 or newer (`node -v`)
- Java, JDK 21 recommended (`java -version`). The emulators need it.
- Git

No Firebase account or real project is needed. Everything runs locally against the emulators using the demo project id `demo-intern-rules`.

## Setup

```
npm install
npm test
```

On the first run you will see many failing tests. This is expected. The starter rules deny everything, so every test that expects access to succeed fails.

## Your task

1. Read `docs/SPEC.md`. It describes who may do what.
2. Open `firestore.rules` and `storage.rules`. Complete every `TODO`.
3. Run `npm test` after each small change. You can run one suite at a time:
   - `npm run test:firestore`
   - `npm run test:storage`
4. When all tests pass, add at least **two tests of your own** that try to break your rules, for example a privilege escalation attempt. Put them in the existing test files.
5. Optional: run `npm run emulators` and open http://127.0.0.1:4000 to explore the Emulator UI.

Do not edit the existing tests to make them pass. Change the rules.

## Rules of the exercise

- Work only against the emulators. Do not deploy these rules to any real Firebase project.
- Do not add real keys, service accounts or `.env` files to this folder.
- Be ready to explain every line of your rules in the review.

## Deliverables

- Repository link containing your completed `firestore.rules` and `storage.rules`
- Screenshot or text output of `npm test` with all tests passing
- Your two additional tests
- A one-page note: for each rule you wrote, what attack it prevents

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `Could not spawn java` | Java is not installed or not on your PATH |
| `port 8080 is not open` or `address in use` | Another process uses the port. Stop it, or change the port in `firebase.json` and `test/helpers.js` |
| Rules fail to compile | The emulator prints the line number. Check for missing semicolons or parentheses |
| All tests fail with connection errors | Run tests with `npm test`, not `node --test`. The script starts the emulators for you |
