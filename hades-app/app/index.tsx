import { useState } from "react";
import { View, TextInput, Button } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../constants/api";

export default function HomeScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      console.log("API_URL:", API_URL);
      console.log("LOGIN URL:", `${API_URL}/login`);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const text = await response.text();
      console.log("RAW LOGIN RESPONSE:", text);

      if (!response.ok) {
        alert(`Login Ð°Ð»Ð´Ð°Ð°: ${response.status} - ${text}`);
        return;
      }

      const data = JSON.parse(text);
      console.log("LOGIN RESPONSE:", data);

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
        alert("Login Ð±Ð¾Ð»Ð»Ð¾Ð¾ ðŸ”¥");
        router.replace("/dashboard");
      } else {
        alert(data.msg || "Login Ð°Ð¼Ð¶Ð¸Ð»Ñ‚Ð³Ò¯Ð¹");
      }
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      alert(`Server Ñ…Ð¾Ð»Ð±Ð¾Ð³Ð´Ð¾Ñ…Ð³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°: ${String(error)}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Username"
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <Button title="Login" onPress={handleLogin} />
      <View style={{ marginTop: 10 }}>
        <Button title="ðŸ“ Ð‘Ò¯Ñ€Ñ‚Ð³Ò¯Ò¯Ð»ÑÑ…" onPress={() => router.push("/register")} />
      </View>
    </View>
  );
}
