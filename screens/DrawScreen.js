// DrawScreen.js
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
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function DrawScreen({ navigation }) {
  const [path, setPath] = useState(() => Skia.Path.Make());
  const pathRef = useRef(path);
  const pointsRef = useRef([]);
  const [locked, setLocked] = useState(false);
  const [todayScore, setTodayScore] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const checkAttempt = async () => {
      const today = new Date().toDateString();
      const lastAttempt = await AsyncStorage.getItem("circleAttempt");
      const storedScore = await AsyncStorage.getItem(`circle-score-${today}`);
      if (lastAttempt === today && storedScore) {
        setLocked(true);
        setTodayScore(parseInt(storedScore, 10));
      }
    };
    checkAttempt();
  }, []);

  // 🔥 Save score to Firestore if user logged in
  const saveScore = async (score) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const userRef = doc(db, "circleGame", uid);

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
      console.error("[CircleGame] Failed to save score:", err);
    }
  };

  // 🎯 When player completes a circle
  const handleCircleComplete = async (score) => {
    if (locked || !auth.currentUser) return;

    const today = new Date().toDateString();
    setTodayScore(score);
    setResult(score > 0 ? "done" : "fail");

    await AsyncStorage.setItem("circleAttempt", today);
    await AsyncStorage.setItem(`circle-score-${today}`, String(score));

    await saveScore(score);

    if (score >= 95) {
      Alert.alert("Perfect!", "🎯 You're a circle master!");
    }

    setLocked(true);
  };

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
    if (pointsRef.current.length < 10) {
      handleCircleComplete(0);
      return;
    }
    const score = calculateCircleScore(pointsRef.current);
    handleCircleComplete(Math.round(score));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(({ x, y }) => !locked && beginPath(x, y))
    .onChange(({ x, y }) => !locked && movePath(x, y))
    .onEnd(() => !locked && endPath());

  // 🚪 Require Login Screen
  if (!auth.currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Circle Challenge</Text>
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

  // 🧱 Locked or finished for today
  if (result || locked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Circle Challenge</Text>
        <Text style={styles.lockedMessage}>⏳ Come back tomorrow!</Text>
        <Text style={styles.bigScore}>Your Score Today: {todayScore}/100</Text>
        <Text style={styles.subtitle}>You only get one attempt per day.</Text>

        <TouchableOpacity
          style={[styles.button, { marginTop: 30 }]}
          onPress={() => navigation.navigate("Leaderboard", { game: "circle" })}
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
            await AsyncStorage.removeItem("circleAttempt");
            await AsyncStorage.removeItem(
              `circle-score-${new Date().toDateString()}`
            );
            setLocked(false);
            setResult(null);
            setTodayScore(0);
            const resetPath = Skia.Path.Make();
            setPath(resetPath);
            pathRef.current = resetPath;
            pointsRef.current = [];
          }}
        >
          <Text style={styles.devButtonText}>🔧 Dev Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🎨 Main Drawing Game
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Circle Challenge</Text>
      <Text style={styles.subtitle}>
        Try to draw the most perfect circle you can!
      </Text>

      <GestureDetector gesture={pan}>
        <Canvas style={styles.canvas}>
          <Path path={path} color="black" style="stroke" strokeWidth={3} />
        </Canvas>
      </GestureDetector>

      <TouchableOpacity
        style={[styles.button, { marginTop: 20 }]}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Circle Scoring Algorithm ---
function calculateCircleScore(points) {
  if (!points || points.length < 10) return 0;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const avgRadius =
    points.reduce(
      (sum, p) => sum + Math.hypot(p.x - centerX, p.y - centerY),
      0
    ) / points.length;

  const variance =
    points.reduce((sum, p) => {
      const r = Math.hypot(p.x - centerX, p.y - centerY);
      return sum + Math.abs(r - avgRadius);
    }, 0) / points.length;

  return Math.max(0, 100 - variance);
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
    height: 300,
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
