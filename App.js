import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// import your real screens
import HomeScreen from "./screens/HomeScreen";
import DrawScreen from "./screens/DrawScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import OppositeScreen from "./screens/Opposite";
import BallScreen from "./screens/BallScreen";
import ThisOrThatScreen from "./screens/ThisOrThatScreen";
import MemoryDrawScreen from "./screens/MemoryDrawScreen";
import LoginScreen from "./screens/Login";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
              headerShown: false, 
            }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Draw" component={DrawScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Opposite" component={OppositeScreen} />
          <Stack.Screen name="Ball" component={BallScreen} />
          <Stack.Screen name="ThisThat" component={ThisOrThatScreen} />
          <Stack.Screen name="MemoryDraw" component={MemoryDrawScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
