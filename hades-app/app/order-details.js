import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router } from "expo-router";

import { API_URL as SERVER_URL } from "../constants/api";
import { getStatusStyle } from "../constants/order-status";
import { card, colors, content, formatCurrency, formatDate, screen } from "../constants/ui";

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams();
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);

      if (!orderId) {
        Alert.alert("Алдаа", "Захиалгын дугаар олдсонгүй.");
        router.back();
        return;
      }

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

      setProfile(profileData.user);

      const detailsRes =
        profileData.user.role === "admin"
          ? await fetch(`${SERVER_URL}/admin/orders/${orderId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          : await fetch(`${SERVER_URL}/order-details/${orderId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

      const detailsData = await detailsRes.json();
      setItems(Array.isArray(detailsData) ? detailsData : []);
    } catch (error) {
      console.log("ORDER DETAILS ERROR:", error);
      Alert.alert("Алдаа", "Захиалгын дэлгэрэнгүй мэдээлэл ачаалсангүй.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const updateStatus = async (newStatus) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${SERVER_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();

      if (response.ok && data.message) {
        loadOrderDetails();
        return;
      }

      Alert.alert("Алдаа", data.msg || "Төлөв шинэчилж чадсангүй.");
    } catch (error) {
      console.log("STATUS UPDATE ERROR:", error);
      Alert.alert("Алдаа", "Төлөв шинэчлэх үед асуудал гарлаа.");
    }
  };

  if (loading) {
    return (
      <View style={[screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Захиалга ачааллаж байна...</Text>
      </View>
    );
  }

  const head = items[0];
  const totalPrice = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const status = getStatusStyle(head?.status || "pending");

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
            ORDER DETAILS
          </Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 8 }}>
            Захиалга #{orderId}
          </Text>
          <Text style={{ color: "#e5e7eb", lineHeight: 22 }}>
            Төлөв, барааны жагсаалт, төлбөрийн мэдээллийг нэг дороос хараарай.
          </Text>
        </View>

        <View style={[card, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 10 }}>
            Ерөнхий мэдээлэл
          </Text>

          {head ? (
            <>
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: status.backgroundColor,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginBottom: 10
                }}
              >
                <Text style={{ color: status.color, fontWeight: "800" }}>{status.label}</Text>
              </View>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Хэрэглэгчийн ID: {head.user_id}</Text>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>
                Төлбөрийн төрөл: {head.payment_method || "Сонгоогүй"}
              </Text>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>
                Тайлбар: {head.payment_note || "-"}
              </Text>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Огноо: {formatDate(head.created_at)}</Text>
              <Text style={{ color: colors.primaryDark, fontSize: 22, fontWeight: "900", marginTop: 8 }}>
                Нийт дүн: {formatCurrency(head.total || totalPrice)}
              </Text>
            </>
          ) : (
            <Text style={{ color: colors.textMuted }}>Энэ захиалгад барааны мэдээлэл алга байна.</Text>
          )}
        </View>

        {profile?.role === "admin" ? (
          <View style={[card, { marginBottom: 16, backgroundColor: "#172033" }]}>
            <Text style={{ color: "white", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
              Төлөв шинэчлэх
            </Text>
            {[
              { key: "paid", label: "Төлбөр батлах", bg: "#2563eb" },
              { key: "completed", label: "Хүргэлт дуусгах", bg: "#16a34a" },
              { key: "pending", label: "Хүлээгдэж буй төлөв", bg: "#ca8a04" },
              { key: "cancelled", label: "Цуцлах", bg: "#dc2626" }
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => updateStatus(item.key)}
                style={{
                  backgroundColor: item.bg,
                  borderRadius: 14,
                  paddingVertical: 13,
                  alignItems: "center",
                  marginBottom: 10
                }}
              >
                <Text style={{ color: "white", fontWeight: "800" }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: 12 }}>
          Захиалсан бараанууд
        </Text>

        {items.length === 0 ? (
          <View style={card}>
            <Text style={{ color: colors.textMuted }}>Захиалгын барааны жагсаалт олдсонгүй.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={`${item.id}-${item.name}`} style={[card, { marginBottom: 14 }]}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
                {item.name}
              </Text>
              <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                Нэгж үнэ: {formatCurrency(item.price)}
              </Text>
              <Text style={{ color: colors.textMuted, marginBottom: 4 }}>Тоо хэмжээ: {item.quantity}</Text>
              <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 18 }}>
                Нийлбэр: {formatCurrency(Number(item.price) * Number(item.quantity))}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
