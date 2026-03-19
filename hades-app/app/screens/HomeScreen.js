import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";

export default function HomeScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "admin" && password === "1234") {
      Alert.alert("Амжилттай нэвтэрлээ!");
    } else {
      Alert.alert("Нэвтрэх нэр эсвэл нууц үг буруу");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 8, borderRadius: 5 },
});