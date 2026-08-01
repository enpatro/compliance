# Compliance Portal - Calibration Dashboard

This package is a static, hostable **Compliance Portal** with tabs for **Calibration**, **AMC**, and **Patrolling**. The Calibration tab is functional now and supports Excel/CSV upload, dashboard KPIs, filters, certificate upload, and export.

## Data used
The included sample data was generated from the uploaded file `after calibration upload.xlsx`. The uploaded file contains calibration records with area / line, machine number, gauge serial number, certificate number, gauge description / location, range, work range, calibration date, and due date fields. The first records include CA4, machine CA4M11, gauge IDs like CA4M11-PG01, certificate numbers like VI/25-26/4650-01, calibration date 28-12-2025, and due date 27-12-2026.

## Folder structure
```text
compliance_portal/
  index.html
  styles.css
  app.js
  firebase-config.js
  firebase.json
  data/
    sample-calibration-data.json
    calibration_upload_template.csv
```

## Run locally
Open `index.html` in browser. For best result, run a small local server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## GitHub Pages hosting
1. Create a new GitHub repository.
2. Upload all files inside `compliance_portal`.
3. Go to **Settings → Pages**.
4. Select source as branch `main` and folder `/root`.
5. Open the published GitHub Pages URL.

## Firebase Hosting with cloud certificate storage
Firebase Hosting is suitable for static and single-page web apps and can deploy files to Google's hosting infrastructure. Firebase also provides GitHub integration for preview/live deployments.

### Steps
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

For cloud data and certificate upload:
1. Open Firebase Console.
2. Enable **Firestore Database**.
3. Enable **Storage**.
4. Open `firebase-config.js`.
5. Paste Firebase web app config.
6. Set:

```javascript
window.useFirebase = true;
```

## Important note
- In **GitHub Pages / local mode**, certificate upload is handled only in browser session/local behavior.
- In **Firebase mode**, certificate upload can be stored in Firebase Storage and metadata in Firestore.

## Next enhancement
- AMC tab: vendor, contract period, visit record, evidence upload.
- Patrolling tab: QR checkpoint, abnormality photo, closure date, responsible owner.
- Login control: Firebase Authentication.
- Mail alerts: Firebase Cloud Functions or Power Automate.
