import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../firebase"; // ⬅️ Added login check

const questions = [
  { a: "Pizza 🍕", b: "Burger 🍔" },
  { a: "Coffee ☕", b: "Tea 🍵" },
  { a: "Beach 🏖️", b: "Mountains 🏔️" },
  { a: "Marvel 🦸", b: "DC 🦇" },
  { a: "Cats 🐱", b: "Dogs 🐶" },
  { a: "Sunrise 🌅", b: "Sunset 🌇" },
  { a: "Texting 💬", b: "Calling 📞" },
  { a: "Sweet 🍫", b: "Savory 🧂" },
  { a: "Early bird 🌅", b: "Night owl 🌙" },
  { a: "Books 📚", b: "Movies 🎬" },
];

let answers = {}; // demo only, reset on app restart

export default function ThisOrThatScreen({ navigation }) {
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [todayQuestion, setTodayQuestion] = useState({});
  const [todayKey, setTodayKey] = useState("");

  useEffect(() => {
    const todayIndex =
      Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % questions.length;
    setTodayQuestion(questions[todayIndex]);

    const today = new Date().toISOString().split("T")[0];
    const key = `thisorthat-${today}`;
    setTodayKey(key);

    (async () => {
      const already = await AsyncStorage.getItem(key);
      if (already) {
        setSubmitted(true);
        setSelected(already);
      }
    })();
  }, []);

  const handleSelect = async (choice) => {
    setSelected(choice);
    setSubmitted(true);
    await AsyncStorage.setItem(todayKey, choice);
  };

  // 🔐 Require Login (same style as DrawScreen)
  if (!auth.currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>This or That</Text>
        <Text style={styles.subtitle}>🚪 Please log in to play</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { marginTop: 15 }]}
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
        <Text style={styles.title}>This or That</Text>

        <Text style={styles.subtitle}>Today's Question:</Text>
        <Text style={styles.question}>
          {todayQuestion.a}  <Text style={{ fontSize: 18 }}>or</Text>  {todayQuestion.b}
        </Text>

        {!submitted ? (
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSelect(todayQuestion.a)}
            >
              <Text style={styles.buttonText}>{todayQuestion.a}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { marginTop: 15 }]}
              onPress={() => handleSelect(todayQuestion.b)}
            >
              <Text style={styles.buttonText}>{todayQuestion.b}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultBox}>
            <Text style={styles.subtitle}>
              You chose: <Text style={{ fontWeight: "bold" }}>{selected}</Text>
            </Text>

            {(() => {
              if (answers[selected]) {
                answers[selected] += 1;
              } else {
                answers[selected] = 1;
              }

              let percentage = (
                (answers[selected] /
                  Object.values(answers).reduce((a, b) => a + b, 0)) *
                100
              ).toFixed(2);

              return (
                <Text style={styles.resultText}>
                  {percentage}% of players chose the same
                </Text>
              );
            })()}

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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef3fb",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 10,
    marginBottom: 10,
  },
  question: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 15,
    color: "#2a4d8f",
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
  resultBox: {
    marginTop: 20,
    alignItems: "center",
  },
  resultText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2a4d8f",
    marginTop: 10,
  },
});
