  import { useState } from "react";
  import { View, TextInput, Button } from "react-native";
  import { router } from "expo-router";
  import AsyncStorage from "@react-native-async-storage/async-storage";

  export default function HomeScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

  const handleLogin = async () => {
  try {
    const response = await fetch("https://hades-server.onrender.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();
    console.log("LOGIN RESPONSE:", data);

    if (data.token) {
      await AsyncStorage.setItem("token", data.token);

      const savedToken = await AsyncStorage.getItem("token");
      console.log("TOKEN:", savedToken);

      alert("Login боллоо 🔥");
      router.push("/dashboard");
    } else {
      alert(data.msg || "Login амжилтгүй");
    }
  } catch (error) {
    console.log(error);
    alert("Server холбогдохгүй байна");
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
    <Button title="📝 Бүртгүүлэх" onPress={() => router.push("/register")} />
  </View>
      </View>
    );
  }