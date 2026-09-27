# Beat the Cube

A small React Native app, built with Expo, that is a cube of daily minigames. Each face of the cube is a different game, you get exactly one attempt at each game per day, and the scored games feed a Firestore-backed leaderboard with daily and all-time views. I built it in my own time to get hands-on with Expo, React Navigation, Firebase, and canvas drawing on mobile.

Built with React Native 0.79 / Expo SDK 53, React 19, React Navigation 7, Firebase (Authentication and Firestore, via the JS SDK), React Native Skia, React Native Gesture Handler and AsyncStorage.

## The games

Five of the six faces are playable; the sixth is a placeholder for the next game.

- **Circle Challenge.** Draw the roundest circle you can in a single stroke. The score takes the centre of the stroke's bounding box, works out the average distance of every point from that centre, and subtracts the mean deviation from that average (in pixels) from 100. A stroke of fewer than ten points scores 0, and 95 or above earns a "Perfect!" alert.
- **Hidden Ball.** A ball bounces around a black box and each wall flashes when it is struck. After two seconds the ball vanishes, apart from a faint flicker every couple of seconds, so you have to keep tracking it from the wall flashes alone. You get one tap: land within the ball's radius and you score 100, otherwise 0.
- **Shape Memory.** A random six-segment shape appears on the canvas for three seconds and then disappears. Redraw it from memory in one stroke. The score is 100 minus the average distance between your stroke and reference points sampled from the target, scaled by the canvas diagonal. The sampling is deliberately simple (evenly spaced across the target's width, random within its height), so scores are noisy; tightening this is on my list.
- **Opposite.** A word of the day, picked from a fixed list by the day number so everyone sees the same word, and one text box: what do you think its opposite is? There is no score. Your answer is saved locally so you cannot answer twice, and appended to a shared `gameResults` collection.
- **This or That.** A daily A-or-B question (coffee or tea, cats or dogs). Pick one and you are shown the percentage of players who chose the same. That percentage is currently computed from an in-memory tally on the device, so it is a placeholder until the votes are stored centrally.

## How it works

**Navigation.** A single native stack (`@react-navigation/native-stack`) with headers hidden. `HomeScreen` is the initial route and renders the two-by-three grid of game tiles; every game screen has its own "Back to Home" button, and the scored games link to the leaderboard with their game pre-selected.

**Auth.** Firebase Authentication with email and password, through the Firebase JS SDK. The app opens without an account; each game checks `auth.currentUser` and shows a "please log in" prompt with a link to the login screen if nobody is signed in. Registering also asks for a username and date of birth and writes a profile to `users/{uid}`. `onAuthStateChanged` sends you back to Home once you are signed in, and Firebase error codes are mapped to friendlier messages.

**One attempt per day.** The lock is held on the device in AsyncStorage. When a scored game finishes, the screen stores `<game>Attempt = today` and `<game>-score-<today>`; on mount it checks those keys and, if they match today's date, renders a locked view with today's score, a leaderboard button and a home button. Opposite and This or That store the answer itself under a date-stamped key. The locked screens also have a "Dev Retry" button that clears the keys, which I use for testing and which needs to go behind `__DEV__` before any release. Nothing enforces the lock server-side yet, although every score write records `lastPlayed`, so it could.

**Scores and leaderboard.** Each scored game has its own Firestore collection (`circleGame`, `ballGame`, `shapeGame`) with one document per user: `{ todayScore, bestScore, lastPlayed }`. On completion the screen reads the previous best, then merges the new values in with `setDoc(..., { merge: true })`. The leaderboard queries the top ten by `todayScore` or `bestScore`, looks up each player's username from `users/{uid}` (falling back to "Anonymous"), and drops rows with no score.

**Rendering.** The two drawing games use `@shopify/react-native-skia`: a `Canvas` with a `Path`, driven by a `react-native-gesture-handler` pan gesture that appends `lineTo` segments as your finger moves and pushes a copy of the path into state so the stroke renders live. The raw points are kept in a ref for scoring. Hidden Ball is plain React Native: a `requestAnimationFrame` loop moves the ball and reflects its velocity at the walls, the wall flashes are 200 ms colour changes, and the flicker is an `Animated` opacity sequence. `expo-gl`, `expo-three` and `three` are installed with a view to some 3D rendering later, but nothing imports them yet.

## Project layout

```
.
├── App.js                   # navigation container and stack
├── index.js                 # registers the root component; imports ./firebase first
├── app.json                 # Expo config
├── firebase.js              # not committed: Firebase init, exports auth and db
├── assets/                  # Expo icon and splash placeholders
└── screens/
    ├── HomeScreen.js        # 2x3 grid of game tiles
    ├── Login.js             # email/password register and login
    ├── DrawScreen.js        # Circle Challenge
    ├── BallScreen.js        # Hidden Ball
    ├── MemoryDrawScreen.js  # Shape Memory
    ├── Opposite.js          # Opposite
    ├── ThisOrThatScreen.js  # This or That
    └── LeaderboardScreen.js
```

## Running locally

You need Node and npm, plus either Expo Go on a phone or an iOS or Android simulator.

```
git clone https://github.com/henryforrest/beat-the-cube.git
cd beat-the-cube
npm install
```

Create a Firebase project with Email/Password sign-in and Firestore enabled, then add a `firebase.js` at the project root. It is gitignored; the screens import `auth` and `db` from it, and `index.js` imports it for its side effects before `App` loads.

```js
// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "<project-id>.firebaseapp.com",
  projectId: "<project-id>",
  storageBucket: "<project-id>.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Then:

```
npx expo start
```

and press `i` or `a` for a simulator, or scan the QR code with Expo Go.

A note on Expo Go: everything the app imports (Skia, Gesture Handler, AsyncStorage and the Firebase JS SDK) is either pure JavaScript or bundled in Expo Go for SDK 53, and the versions in `package.json` match SDK 53's bundled ones, so no custom build is needed. `@react-native-firebase/app`, `/auth` and `/firestore` are also listed in `package.json` from an earlier experiment; they are not imported anywhere, and switching to them would require a development build (`npx expo prebuild` or EAS Build) because they need native code.

## Status

An independent side project, started in August 2025. It is not published on either app store. Next on the list: move the daily lock and the This or That vote counting server-side, replace the Shape Memory sampling with proper path sampling, hide the dev retry button, and build the sixth face.
