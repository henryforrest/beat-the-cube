import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

export default function AuthScreen({ navigation }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 Auto-redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.replace("Home");
      }
    });
    return unsubscribe;
  }, []);

  const handleRegister = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        username,
        dob,
        createdAt: serverTimestamp(),
      });

      // no need for navigation here; onAuthStateChanged will redirect
    } catch (err) {
      console.error("Register error:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle navigation
    } catch (err) {
      console.error("Login error:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err) => {
    switch (err.code) {
      case "auth/email-already-in-use":
        setError("This email is already registered.");
        break;
      case "auth/invalid-email":
        setError("Invalid email address.");
        break;
      case "auth/weak-password":
        setError("Password should be at least 6 characters.");
        break;
      case "auth/user-not-found":
        setError("No account found with this email.");
        break;
      case "auth/wrong-password":
        setError("Incorrect password.");
        break;
      default:
        setError(err.message || "Something went wrong");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{isRegistering ? "Register" : "Login"}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Birth (YYYY-MM-DD)"
            value={dob}
            onChangeText={setDob}
          />
        </>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2a4d8f" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={isRegistering ? handleRegister : handleLogin}
        >
          <Text style={styles.buttonText}>
            {isRegistering ? "Register" : "Login"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => {
          setIsRegistering(!isRegistering);
          setError("");
        }}
      >
        <Text style={styles.toggleButtonText}>
          {isRegistering
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#eef3fb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2a4d8f",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  toggleButton: {
    marginTop: 15,
  },
  toggleButtonText: {
    color: "#2a4d8f",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});
