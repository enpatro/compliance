# Compliance Portal - Fixed GitHub + Firebase Launch Package

This version fixes the GitHub Pages layout issue by using clean non-minified HTML/CSS and a `.nojekyll` file.

## GitHub Pages launch
1. Upload all files to repository root.
2. Go to Settings > Pages.
3. Select GitHub Actions as source.
4. Push to main.

## Firebase launch
1. Create Firebase project.
2. Enable Hosting, Firestore and Storage.
3. Paste Firebase web config in `firebase-config.js`.
4. Set `window.useFirebase = true`.
5. Deploy:
```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy
```

## Upload sequence
```text
area,machineNo,gaugeId,certificateNo,gaugeDescription,range,workRange,lc,errorPercent,calibrationDate,dueDate,error %,certificateFileName
```
