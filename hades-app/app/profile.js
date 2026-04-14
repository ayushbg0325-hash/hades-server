import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL } from "../constants/api";
import { card, colors, content, screen } from "../constants/ui";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Нэвтрэлт шаардлагатай", "Эхлээд систем рүү нэвтэрнэ үү.");
        router.replace("/");
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok || !data.user) {
        Alert.alert("Алдаа", data.msg || "Профайл уншиж чадсангүй.");
        router.replace("/");
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.log("PROFILE ERROR:", error);
      Alert.alert("Алдаа", "Профайл ачаалсангүй.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/");
  };

  if (loading) {
    return (
      <View style={[screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Профайл ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={screen}>
      <View style={content}>
        <View
          style={{
            backgroundColor: colors.primaryDark,
            borderRadius: 30,
            padding: 22,
            marginBottom: 16
          }}
        >
          <Text style={{ color: "#fdba74", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>PROFILE</Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 8 }}>
            Хувийн мэдээлэл
          </Text>
          <Text style={{ color: "#ffedd5", lineHeight: 22 }}>
            Таны эрх, хэрэглэгчийн дугаар, нэвтрэх мэдээлэл энд харагдана.
          </Text>
        </View>

        <View style={[card, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 14 }}>
            Бүртгэлийн мэдээлэл
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Нэвтрэх нэр: {user?.username}</Text>
          <Text style={{ color: colors.textMuted, marginBottom: 14 }}>Хэрэглэгчийн ID: {user?.id}</Text>

          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: user?.role === "admin" ? "#fee2e2" : "#dbeafe",
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8
            }}
          >
            <Text
              style={{
                color: user?.role === "admin" ? colors.danger : "#1d4ed8",
                fontWeight: "800"
              }}
            >
              {user?.role === "admin" ? "Админ хэрэглэгч" : "Энгийн хэрэглэгч"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.9}
          style={{
            backgroundColor: "#fee2e2",
            borderRadius: 18,
            paddingVertical: 15,
            alignItems: "center"
          }}
        >
          <Text style={{ color: colors.danger, fontWeight: "800", fontSize: 16 }}>Системээс гарах</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
