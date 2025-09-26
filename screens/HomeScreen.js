import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const games = [
  { name: "Circle 🎯", route: "Draw" },
  { name: "Opposite", route: "Opposite" },
  { name: "Hidden Ball 🔮", route: "Ball" },
  { name: "This or That", route: "ThisThat" },
  { name: "Memory Draw", route: "MemoryDraw" },
  { name: "Coming Soon" },
];

export default function HomeScreen({ navigation }) {
  const handlePress = (game) => {
    if (game.route) navigation.navigate(game.route);
    else alert("Coming Soon!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beat The Cube</Text>
      <Text style={styles.subtitle}>6 Exciting & Addictive Minigames</Text>

      <View style={styles.grid}>
        {games.map((game, index) => (
          <TouchableOpacity
            key={index}
            style={styles.face}
            onPress={() => handlePress(game)}
          >
            <Text style={styles.faceText}>{game.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#eef3fb" }, 
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 4, color: "#333" },
  subtitle: { fontSize: 16, marginBottom: 20, color: "#2a4d8f" },
  grid: { flexDirection: "row", flexWrap: "wrap", width: 300, justifyContent: "space-between" },
  face: {
    width: 140,
    height: 140,
    backgroundColor: "#2a4d8f", //#2a4d8f blue to start with and #DAA520 gold if they complete the game by getting a perfect score
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 16,
  },
  faceText: { color: "#fff", fontSize: 18, fontWeight: "600", textAlign: "center" },
});
