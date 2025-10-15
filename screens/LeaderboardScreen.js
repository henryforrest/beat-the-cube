import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";

// ✅ Updated collection names to match your other screens
const GAME_COLLECTIONS = {
  circle: "circleGame",
  ball: "ballGame",
  memory: "shapeGame", // changed from memoryDrawGame → shapeGame
};

export default function LeaderboardScreen({ route, navigation }) {
  const [game, setGame] = useState(route.params?.game || "circle");
  const [mode, setMode] = useState("today"); // "today" or "allTime"
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, [game, mode]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const colName = GAME_COLLECTIONS[game];
      if (!colName) {
        console.warn("[Leaderboard] Invalid game key:", game);
        setScores([]);
        setLoading(false);
        return;
      }

      const colRef = collection(db, colName);
      let q;

      // ✅ Firestore can't order by undefined fields, so use conditional fallback
      if (mode === "today") {
        q = query(colRef, orderBy("todayScore", "desc"), limit(10));
      } else {
        q = query(colRef, orderBy("bestScore", "desc"), limit(10));
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setScores([]);
        setLoading(false);
        return;
      }

      // ✅ Add username lookup for each score
      const results = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() || {};
          let username = "Anonymous";

          try {
            const userDoc = await getDoc(doc(db, "users", docSnap.id));
            if (userDoc.exists()) {
              username = userDoc.data().username || "Anonymous";
            }
          } catch (err) {
            console.warn("[Leaderboard] Failed to fetch username:", err);
          }

          return {
            id: docSnap.id,
            username,
            todayScore: data.todayScore ?? 0,
            bestScore: data.bestScore ?? 0,
          };
        })
      );

      // ✅ Filter out users who have no scores (all 0)
      const filtered = results.filter(
        (item) => item.todayScore > 0 || item.bestScore > 0
      );

      setScores(filtered);
    } catch (err) {
      console.error("[Leaderboard] fetchScores error:", err);
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.scoreRow}>
      <Text style={styles.rank}>{index + 1}.</Text>
      <Text style={styles.userId}>{item.username}</Text>
      <Text style={styles.score}>
        {mode === "today" ? item.todayScore : item.bestScore}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      {/* Game selector */}
      <View style={styles.selectorRow}>
        {Object.entries(GAME_COLLECTIONS).map(([key]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.selectorButton,
              game === key && styles.activeButton,
            ]}
            onPress={() => setGame(key)}
          >
            <Text
              style={[
                styles.selectorText,
                game === key && styles.activeText,
              ]}
            >
              {key === "circle"
                ? "Circle"
                : key === "ball"
                ? "Invisible Ball"
                : "Memory Draw"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mode selector */}
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            mode === "today" && styles.activeButton,
          ]}
          onPress={() => setMode("today")}
        >
          <Text
            style={[
              styles.selectorText,
              mode === "today" && styles.activeText,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            mode === "allTime" && styles.activeButton,
          ]}
          onPress={() => setMode("allTime")}
        >
          <Text
            style={[
              styles.selectorText,
              mode === "allTime" && styles.activeText,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2a4d8f" style={{ marginTop: 20 }} />
      ) : scores.length === 0 ? (
        <Text style={{ marginTop: 20, color: "#777" }}>No scores yet.</Text>
      ) : (
        <FlatList
          data={scores}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={{ marginTop: 20, width: "100%" }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      )}

      {/* Back to Home button */}
      <TouchableOpacity
        style={[styles.homeButton, { marginTop: 30 }]}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
    textAlign: "center",
    color: "#2a4d8f",
  },
  selectorRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  selectorButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#2a4d8f",
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: "#2a4d8f",
  },
  selectorText: {
    color: "#2a4d8f",
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rank: {
    width: 30,
    fontWeight: "bold",
    color: "#333",
  },
  userId: {
    flex: 1,
    color: "#555",
  },
  score: {
    fontWeight: "bold",
    color: "#2a4d8f",
  },
  homeButton: {
    backgroundColor: "#2a4d8f",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
