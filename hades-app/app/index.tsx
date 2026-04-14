import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../constants/api";
import {
  buttonText,
  card,
  colors,
  content,
  input,
  primaryButton,
  screen,
  secondaryButton,
  secondaryButtonText
} from "../constants/ui";

export default function HomeScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Анхаар", "Нэвтрэх нэр болон нууц үгээ оруулна уу.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ username, password })
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        Alert.alert("Нэвтрэхэд алдаа гарлаа", data.msg || "Мэдээллээ шалгаад дахин оролдоно уу.");
        return;
      }

      if (!data.token) {
        Alert.alert("Нэвтрэх боломжгүй", "Серверээс токен ирсэнгүй.");
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      router.replace("/dashboard");
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      Alert.alert("Сервертэй холбогдсонгүй", "API ажиллаж байгаа эсэхийг шалгаад дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[content, { flex: 1, justifyContent: "center" }]}>
        <View
          style={{
            backgroundColor: colors.primaryDark,
            borderRadius: 30,
            padding: 24,
            marginBottom: 18
          }}
        >
          <Text style={{ color: "#fef3c7", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>
            HADES STORE
          </Text>
          <Text style={{ color: "white", fontSize: 32, fontWeight: "900", marginBottom: 10 }}>
            Захиалгын апп руу нэвтрэх
          </Text>
          <Text style={{ color: "#fed7aa", lineHeight: 22 }}>
            Бараа, сагс, төлбөр, захиалгын түүхээ нэг дороос удирдаарай.
          </Text>
        </View>

        <View style={card}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
            Тавтай морил
          </Text>
          <Text style={{ color: colors.textMuted, lineHeight: 21, marginBottom: 18 }}>
            Бүртгэлтэй хэрэглэгч нэвтэрч үргэлжлүүлнэ үү.
          </Text>

          <TextInput
            placeholder="Нэвтрэх нэр"
            placeholderTextColor={colors.textSoft}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={[input, { marginBottom: 12 }]}
          />

          <TextInput
            placeholder="Нууц үг"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[input, { marginBottom: 16 }]}
          />

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.9} style={primaryButton}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={buttonText}>Нэвтрэх</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            activeOpacity={0.9}
            style={[secondaryButton, { marginTop: 12 }]}
          >
            <Text style={secondaryButtonText}>Шинэ хэрэглэгч бүртгүүлэх</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
