import { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { router } from "expo-router";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const response = await fetch("http://localhost:3000/register", {
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

      if (data.msg) {
        alert(data.msg);
        router.push("/");
      } else {
        alert("Бүртгэл амжилтгүй");
      }
    } catch (error) {
      console.log(error);
      alert("Сервер холбогдохгүй байна");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
        📝 Бүртгүүлэх
      </Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 20, padding: 10, borderRadius: 8 }}
      />

      <Button title="✅ Бүртгүүлэх" onPress={handleRegister} />
    </View>
  );
}