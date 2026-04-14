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

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert("Анхаар", "Бүх талбарыг бөглөнө үү.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Бүртгэл амжилтгүй", data.msg || "Дахин оролдоно уу.");
        return;
      }

      Alert.alert("Амжилттай", data.msg || "Бүртгэл амжилттай үүслээ.");
      router.replace("/");
    } catch (error) {
      console.log("REGISTER ERROR:", error);
      Alert.alert("Сервертэй холбогдсонгүй", "Дараа дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[content, { flex: 1, justifyContent: "center" }]}>
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 30,
            padding: 24,
            marginBottom: 18
          }}
        >
          <Text style={{ color: "#cffafe", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>
            NEW ACCOUNT
          </Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 10 }}>
            Шинэ хэрэглэгч үүсгэх
          </Text>
          <Text style={{ color: "#e0f2fe", lineHeight: 22 }}>
            Нэвтрэх эрхээ үүсгээд шууд бараа захиалах боломжтой.
          </Text>
        </View>

        <View style={card}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 16 }}>
            Бүртгэлийн мэдээлэл
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
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[input, { marginBottom: 16 }]}
          />

          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.9} style={primaryButton}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={buttonText}>Бүртгүүлэх</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.9}
            style={[secondaryButton, { marginTop: 12 }]}
          >
            <Text style={secondaryButtonText}>Нэвтрэх хэсэг рүү буцах</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
