// Opposite.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔥 Firebase
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const words = [
  "pizza",
  "rain",
  "music",
  "cloud",
  "friendship",
  "coffee",
  "robot",
  "mountain",
  "mirror",
  "dog",
];

export default function OppositeScreen({ navigation }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [todayWord, setTodayWord] = useState("");
  const [todayKey, setTodayKey] = useState("");

  useEffect(() => {
    const todayIndex =
      Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % words.length;
    setTodayWord(words[todayIndex]);

    const today = new Date().toISOString().split("T")[0];
    const key = `opposite-${today}`;
    setTodayKey(key);

    (async () => {
      const already = await AsyncStorage.getItem(key);
      if (already) {
        setSubmitted(true);
        setAnswer(already);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!answer.trim() || !auth.currentUser) return;
    setSubmitted(true);

    await AsyncStorage.setItem(todayKey, answer);

    try {
      await addDoc(collection(db, "gameResults"), {
        userId: auth.currentUser.uid,
        game: "opposite",
        word: todayWord,
        answer,
        date: new Date().toISOString().split("T")[0],
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error saving to Firestore:", err);
    }
  };

  if (!auth.currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Opposite</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Opposite</Text>
        <Text style={styles.wordOfDay}>Word of the day:</Text>
        <Text style={styles.word}>{todayWord}</Text>

        {!submitted ? (
          <>
            <TextInput
              placeholder="Enter what you think is the opposite..."
              value={answer}
              onChangeText={setAnswer}
              style={styles.input}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.resultBox}>
            <Text style={styles.subtitle}>
              You answered:{" "}
              <Text style={{ fontWeight: "bold" }}>{answer}</Text>
            </Text>
            <Text style={styles.resultText}>✅ Answer recorded globally</Text>
            <TouchableOpacity
              style={[styles.button, { marginTop: 30 }]}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#eef3fb", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, elevation: 4 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  wordOfDay: { textAlign: "center", fontSize: 16, color: "#777" },
  word: { fontSize: 24, fontWeight: "600", textAlign: "center", marginVertical: 15, color: "#2a4d8f" },
  input: { height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginTop: 20, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#2a4d8f", paddingVertical: 12, borderRadius: 10, width: "100%", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 18, textAlign: "center", fontWeight: "600" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 10 },
  resultBox: { marginTop: 20, alignItems: "center" },
  resultText: { fontSize: 18, fontWeight: "600", marginTop: 10, textAlign: "center" },
});
