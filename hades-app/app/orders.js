import { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const SERVER_URL = "https://hades-server.onrender.com";
const getStatusStyle = (status) => {
  switch (status) {
    case "paid":
      return {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
        label: "Paid"
      };
    case "completed":
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
        label: "Completed"
      };
    case "cancelled":
      return {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        label: "Cancelled"
      };
    case "pending":
    default:
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        label: "Pending"
      };
  }
};
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        router.replace("/");
        return;
      }

      // 1. profile авах
      const profileRes = await fetch(`${SERVER_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const profileData = await profileRes.json();
      console.log("PROFILE DATA:", profileData);

      if (!profileRes.ok || !profileData.user) {
        Alert.alert("Алдаа", profileData.msg || "Profile уншиж чадсангүй");
        router.replace("/");
        return;
      }

      const userId = profileData.user.id;

      // 2. orders авах
      const ordersRes = await fetch(`${SERVER_URL}/orders/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const ordersData = await ordersRes.json();
      console.log("ORDERS DATA:", ordersData);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.log("ORDERS ERROR:", error);
      Alert.alert("Алдаа", "Захиалгын түүх ачаалж чадсангүй");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Түр хүлээнэ үү...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6", padding: 16, paddingTop: 30 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 20
        }}
      >
        📦 Захиалгын түүх
      </Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 14,
              padding: 20
            }}
          >
            <Text style={{ textAlign: "center", color: "#6b7280" }}>
              Захиалга алга байна
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
  router.push({
    pathname: "/order-details",
    params: { orderId: String(item.id) }
  })
}
            style={{
              backgroundColor: "white",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>
              Order #{item.id}
            </Text>

            <Text style={{ marginBottom: 4 }}>Нийт дүн: {item.total}₮</Text>
            <View
  style={{
    alignSelf: "flex-start",
    backgroundColor: getStatusStyle(item.status || "pending").backgroundColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8
  }}
>
  <Text
    style={{
      color: getStatusStyle(item.status || "pending").color,
      fontWeight: "700"
    }}
  >
    {getStatusStyle(item.status || "pending").label}
  </Text>
</View>
            <Text>Огноо: {item.created_at}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}