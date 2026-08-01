# Compliance Portal - GitHub + Firebase Launch Package

## Local test
```bash
python -m http.server 8080
```
Open `http://localhost:8080`.

## GitHub Pages launch
1. Create a GitHub repository.
2. Upload all files to repository root.
3. Go to Settings > Pages.
4. Select GitHub Actions as source.
5. Push to `main`.
6. Workflow `.github/workflows/deploy-github-pages.yml` publishes the portal.

## Firebase launch
1. Create Firebase project.
2. Enable Hosting, Firestore Database, Storage.
3. Copy Firebase web app config into `firebase-config.js`.
4. Set `window.useFirebase = true`.
5. Deploy:
```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy
```

## GitHub to Firebase CI/CD
1. Run:
```bash
firebase init hosting:github
```
2. Add repo secrets: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`.
3. Use included Firebase workflows.

## Upload sequence
```text
area,machineNo,gaugeId,certificateNo,gaugeDescription,range,workRange,lc,errorPercent,calibrationDate,dueDate,error %,certificateFileName
```
