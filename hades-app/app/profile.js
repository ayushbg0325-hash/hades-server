import { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { API_URL } from "../constants/api";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          Alert.alert("Error", "You are not logged in");
          router.replace("/");
          return;
        }

        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
          Alert.alert("Error", data.msg || "Could not load profile");
          router.replace("/");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.log("PROFILE ERROR:", error);
        Alert.alert("Error", "Could not load profile");
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    Alert.alert("Success", "Logged out");
    router.replace("/");
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
        Profile
      </Text>

      <View
        style={{
          backgroundColor: "#f5f5f5",
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
            borderRadius: 999,
            marginTop: 4
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

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
