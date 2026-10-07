# KL STREAM

KL STREAM is a browser-based video streaming platform project built with HTML, CSS and JavaScript.

## Main modules

- **User Module:** login, signup, browse, search, category filtering, watchlist, recommendations, history, subscription demo, parental control and video uploads.
- **Admin Module:** review creator uploads, approve/reject submissions, manage published videos and view locally stored project profiles.

## Authentication

The project is connected to the existing Firebase project `kl-stream`.

- New accounts are created with Firebase Authentication using email/password.
- Login is verified by Firebase Authentication.
- Passwords are **not** stored in Local Storage.
- Forgot Password uses Firebase's real password-reset email flow.
- Watchlist, history, subscription state, parental-control state and other project data remain in the browser's Local Storage for now.

Firebase Authentication is documented by Firebase as the service that manages email/password accounts and password-reset emails.

## Important Firebase setup

Before testing authentication, open the Firebase Console for the `kl-stream` project:

1. Go to **Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. In **Authentication → Settings → Authorized domains**, add `localhost` if it is not already present.
4. Save the changes.

Then run the project through a local web server. For example, in VS Code use Live Server and open the site through a URL such as `http://127.0.0.1:5500/index.html`.

Do not open the HTML file directly with `file://` because browser module loading and Firebase authentication are intended to run from a web origin.

## Parental Control behavior

Parental Control is a real access check, not just a status label.

1. Open **Profile → Parental Controls**.
2. Enter a 4-digit PIN and click **Enable / Update PIN**.
3. After it is enabled, clicking **Watch** requires the correct PIN.
4. A correct PIN unlocks video viewing for the current browser session while keeping Parental Control enabled.
5. The Profile page also has **Unlock Viewing Session** for entering the PIN before browsing to a video.
6. **Disable Parental Control** also requires the correct PIN.
7. An incorrect PIN blocks video access.
8. The session unlock is cleared when the user logs out or starts a new login session.

## Subscription

KL Stream Pro is a demonstration-only subscription. Clicking Subscribe activates the plan locally; no real payment is processed.

## Creator uploads

Users provide a video link, title, category and description. The upload is stored locally as **Pending** until the admin approves it. No video file is uploaded to the project.

## Categories

The default catalog contains only:

- Movies
- TV Shows
- Live Streams

## Admin login

For the classroom demonstration:

- Email: `admin@klstream.com`
- Password: `admin123`

Change the admin credentials before using the project outside the classroom.

## Technologies

- HTML5
- CSS3
- JavaScript (ES modules)
- Firebase Authentication for real email/password authentication
- Browser Local Storage for project data
