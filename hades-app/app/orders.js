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

import { API_URL as SERVER_URL } from "../constants/api";
import { getStatusStyle } from "../constants/order-status";
import { card, colors, content, formatCurrency, formatDate, screen } from "../constants/ui";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Нэвтрэлт шаардлагатай", "Эхлээд систем рүү нэвтэрнэ үү.");
        router.replace("/");
        return;
      }

      const profileRes = await fetch(`${SERVER_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.user) {
        Alert.alert("Алдаа", profileData.msg || "Профайл уншиж чадсангүй.");
        router.replace("/");
        return;
      }

      const ordersRes = await fetch(`${SERVER_URL}/orders/${profileData.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.log("ORDERS ERROR:", error);
      Alert.alert("Алдаа", "Захиалгын түүх ачаалсангүй.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  if (loading) {
    return (
      <View style={[screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Захиалгууд ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={screen}>
      <View style={content}>
        <View
          style={{
            backgroundColor: "#1f2937",
            borderRadius: 30,
            padding: 22,
            marginBottom: 16
          }}
        >
          <Text style={{ color: "#cbd5e1", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>
            ORDER HISTORY
          </Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 8 }}>
            Миний захиалгууд
          </Text>
          <Text style={{ color: "#e5e7eb", lineHeight: 22 }}>
            Захиалга бүрийн төлөв, дүн, дэлгэрэнгүй мэдээллийг эндээс харна.
          </Text>
        </View>

        {orders.length === 0 ? (
          <View style={card}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
              Захиалга алга
            </Text>
            <Text style={{ color: colors.textMuted }}>Шинэ бараа сонгоод анхны захиалгаа үүсгээрэй.</Text>
          </View>
        ) : (
          orders.map((item) => {
            const status = getStatusStyle(item.status || "pending");
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/order-details",
                    params: { orderId: String(item.id) }
                  })
                }
                activeOpacity={0.9}
                style={[card, { marginBottom: 14 }]}
              >
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
                  Захиалга #{item.id}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: status.backgroundColor,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    marginBottom: 10
                  }}
                >
                  <Text style={{ color: status.color, fontWeight: "800" }}>{status.label}</Text>
                </View>
                <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                  Нийт дүн: {formatCurrency(item.total)}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 10 }}>
                  Огноо: {formatDate(item.created_at)}
                </Text>
                <Text style={{ color: colors.primaryDark, fontWeight: "800" }}>Дэлгэрэнгүй харах</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
