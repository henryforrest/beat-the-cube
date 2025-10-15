// ShapeMemoryScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function ShapeMemoryScreen({ navigation }) {
  const [path, setPath] = useState(() => Skia.Path.Make());
  const [targetShape, setTargetShape] = useState(() => generateShape());
  const [showShape, setShowShape] = useState(true);
  const pathRef = useRef(path);
  const pointsRef = useRef([]);
  const [locked, setLocked] = useState(false);
  const [todayScore, setTodayScore] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const checkAttempt = async () => {
      const today = new Date().toDateString();
      const lastAttempt = await AsyncStorage.getItem("shapeAttempt");
      const storedScore = await AsyncStorage.getItem(`shape-score-${today}`);
      if (lastAttempt === today && storedScore) {
        setLocked(true);
        setTodayScore(parseInt(storedScore, 10));
      }
    };
    checkAttempt();

    // Show shape briefly, then hide
    const timer = setTimeout(() => setShowShape(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // 🔥 Save to Firestore
  const saveScore = async (score) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const userRef = doc(db, "shapeGame", uid);

    try {
      const snap = await getDoc(userRef);
      const prevBest = snap.exists() ? snap.data().bestScore || 0 : 0;
      const newBest = Math.max(prevBest, score);

      await setDoc(
        userRef,
        {
          todayScore: score,
          bestScore: newBest,
          lastPlayed: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("[ShapeGame] Failed to save score:", err);
    }
  };

  // 🧩 When shape is completed
  const handleShapeComplete = async (score) => {
    if (locked || !auth.currentUser) return;

    const today = new Date().toDateString();
    setTodayScore(score);
    setResult("done");

    await AsyncStorage.setItem("shapeAttempt", today);
    await AsyncStorage.setItem(`shape-score-${today}`, String(score));

    await saveScore(score);

    if (score >= 95) {
      Alert.alert("Perfect!", "🎯 You memorized it perfectly!");
    }

    setLocked(true);
  };

  // --- Drawing Functions ---
  const beginPath = (x, y) => {
    const newPath = Skia.Path.Make();
    newPath.moveTo(x, y);
    pathRef.current = newPath;
    setPath(newPath.copy());
    pointsRef.current = [{ x, y }];
  };

  const movePath = (x, y) => {
    pathRef.current.lineTo(x, y);
    setPath(pathRef.current.copy());
    pointsRef.current.push({ x, y });
  };

  const endPath = () => {
    if (pointsRef.current.length < 5) {
      handleShapeComplete(0);
      return;
    }
    const score = compareShapes(pointsRef.current, targetShape);
    handleShapeComplete(Math.round(score));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(({ x, y }) => !locked && beginPath(x, y))
    .onChange(({ x, y }) => !locked && movePath(x, y))
    .onEnd(() => !locked && endPath());

  // 🚪 Require Login
  if (!auth.currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Shape Memory</Text>
        <Text style={styles.subtitle}>🚪 Please log in to play</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🔒 Locked / Finished Screen
  if (result || locked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Shape Memory</Text>
        <Text style={styles.lockedMessage}>⏳ Come back tomorrow!</Text>
        <Text style={styles.bigScore}>Your Score Today: {todayScore}/100</Text>
        <Text style={styles.subtitle}>You only get one attempt per day.</Text>

        <TouchableOpacity
          style={[styles.button, { marginTop: 30 }]}
          onPress={() => navigation.navigate("Leaderboard", { game: "shape" })}
        >
          <Text style={styles.buttonText}>View Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { marginTop: 20 }]}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>

        {/* 🔧 Dev Retry */}
        <TouchableOpacity
          style={[styles.devButton, { marginTop: 20 }]}
          onPress={async () => {
            await AsyncStorage.removeItem("shapeAttempt");
            await AsyncStorage.removeItem(
              `shape-score-${new Date().toDateString()}`
            );
            setLocked(false);
            setResult(null);
            setTodayScore(0);
            setPath(Skia.Path.Make());
            setTargetShape(generateShape());
            setShowShape(true);
            setTimeout(() => setShowShape(false), 3000);
          }}
        >
          <Text style={styles.devButtonText}>🔧 Dev Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🎨 Play Screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shape Memory</Text>
      <Text style={styles.subtitle}>
        Memorize the shape, then draw it from memory!
      </Text>

      <GestureDetector gesture={pan}>
        <Canvas style={styles.canvas}>
          {showShape && (
            <Path
              path={targetShape}
              color="#2a4d8f"
              style="stroke"
              strokeWidth={3}
            />
          )}
          <Path path={path} color="black" style="stroke" strokeWidth={3} />
        </Canvas>
      </GestureDetector>

      <TouchableOpacity
        style={[styles.button, { marginTop: 15 }]}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- 🔹 Helper Functions ---
function generateShape() {
  const path = Skia.Path.Make();
  let x = 50 + Math.random() * 200;
  let y = 50 + Math.random() * 200;
  path.moveTo(x, y);
  for (let i = 0; i < 6; i++) {
    x += Math.random() * 160 - 80;
    y += Math.random() * 160 - 80;
    path.lineTo(x, y);
  }
  return path;
}

function compareShapes(userPoints, targetPath) {
  const targetPoints = samplePath(targetPath, 40);
  const len = Math.min(userPoints.length, targetPoints.length);
  let totalDist = 0;

  for (let i = 0; i < len; i++) {
    totalDist += Math.hypot(
      userPoints[i].x - targetPoints[i].x,
      userPoints[i].y - targetPoints[i].y
    );
  }

  const avgDist = totalDist / len;
  const canvasDiag = Math.hypot(300, 300);
  let score = 100 - (avgDist / canvasDiag) * 100;
  return Math.max(0, Math.min(100, score));
}

function samplePath(path, numPoints) {
  const points = [];
  const bounds = path.getBounds();
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: bounds.x + (i / numPoints) * bounds.width,
      y: bounds.y + Math.random() * bounds.height,
    });
  }
  return points;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef3fb",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
    color: "#555",
  },
  lockedMessage: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#d9534f",
    marginTop: 10,
    textAlign: "center",
  },
  bigScore: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    color: "#2a4d8f",
    textAlign: "center",
  },
  canvas: {
    width: "100%",
    height: 400,
    backgroundColor: "#f6f6f6",
    borderRadius: 12,
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#2a4d8f",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  devButton: {
    backgroundColor: "#f39c12",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
  },
  devButtonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "700",
  },
});
