import { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          Alert.alert("Алдаа", "Нэвтрээгүй байна");
          router.replace("/");
          return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);
      } catch (error) {
        console.log("PROFILE ERROR:", error);
        Alert.alert("Алдаа", "Хэрэглэгчийн мэдээлэл уншиж чадсангүй");
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    Alert.alert("Амжилттай", "Системээс гарлаа");
    router.replace("/");
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Түр хүлээнэ үү...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
        👤 Profile
      </Text>

      <View
        style={{
          backgroundColor: "#f5f5f5",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20
        }}
      >
        <View
  style={{
    backgroundColor: "#f9fafb",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  }}
>
  <Text style={{ fontSize: 18, marginBottom: 10 }}>
    Username: {user.username}
  </Text>

  <Text style={{ fontSize: 18, marginBottom: 10 }}>
    User ID: {user.id}
  </Text>

  <View
    style={{
      alignSelf: "flex-start",
      backgroundColor: user.role === "admin" ? "#fee2e2" : "#dbeafe",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999
    }}
  >
    <Text
      style={{
        color: user.role === "admin" ? "#b91c1c" : "#1d4ed8",
        fontWeight: "700"
      }}
    >
      {user.role === "admin" ? "ADMIN" : "USER"}
    </Text>
  </View>
</View>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>
          Username: {user.username}
        </Text>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>
          User ID: {user.id}
        </Text>
        <Text style={{ fontSize: 18 }}>
          Role: {user.role}
        </Text>
      </View>

      <Button title="🔓 Logout" onPress={handleLogout} />
    </View>
  );
}