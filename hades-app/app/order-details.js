import { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, Button, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router } from "expo-router";

const SERVER_URL = "https://hades-server.onrender.com";

const getStatusStyle = (status) => {
  switch (status) {
    case "paid":
      return {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
        label: "Төлбөр авсан"
      };
    case "completed":
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
        label: "Дууссан"
      };
    case "cancelled":
      return {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        label: "Цуцалсан"
      };
    case "pending":
    default:
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        label: "Төлбөр хүлээгдэж байна"
      };
  }
};

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams();

  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrderDetails = async () => {
    try {
      if (!orderId) {
        Alert.alert("Алдаа", "Order ID олдсонгүй");
        return;
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        router.replace("/");
        return;
      }

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

      setProfile(profileData.user);

      let detailsRes;

      if (profileData.user.role === "admin") {
        detailsRes = await fetch(`${SERVER_URL}/admin/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        detailsRes = await fetch(`${SERVER_URL}/order-details/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      const detailsData = await detailsRes.json();
      console.log("ORDER DETAILS:", detailsData);

      setItems(Array.isArray(detailsData) ? detailsData : []);
    } catch (error) {
      console.log("ORDER DETAILS ERROR:", error);
      Alert.alert("Алдаа", "Order details уншиж чадсангүй");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const updateStatus = async (newStatus) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${SERVER_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (data.message) {
        Alert.alert("Амжилттай", data.message);
        loadOrderDetails();
      } else {
        Alert.alert("Алдаа", data.msg || "Status өөрчилж чадсангүй");
      }
    } catch (error) {
      console.log("STATUS UPDATE ERROR:", error);
      Alert.alert("Алдаа", "Status update хийхэд алдаа гарлаа");
    }
  };

  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Түр хүлээнэ үү...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f3f4f6", padding: 16, paddingTop: 30 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 20
        }}
      >
        🧾 Захиалгын дэлгэрэнгүй
      </Text>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Order #{orderId}
        </Text>

        {items.length > 0 ? (
          <>
            <Text style={{ marginBottom: 6 }}>
              User ID: {items[0].user_id}
            </Text>

            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: getStatusStyle(items[0].status || "pending").backgroundColor,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                marginBottom: 10
              }}
            >
              <Text
                style={{
                  color: getStatusStyle(items[0].status || "pending").color,
                  fontWeight: "700"
                }}
              >
                {getStatusStyle(items[0].status || "pending").label}
              </Text>
            </View>

            <Text style={{ marginBottom: 8, fontWeight: "600" }}>
              Төлбөрийн төлөв: {getStatusStyle(items[0].status || "pending").label}
            </Text>

            <Text style={{ marginBottom: 6 }}>
              Огноо: {items[0].created_at}
            </Text>

            <Text style={{ fontWeight: "700" }}>
              Нийт дүн: {items[0].total || totalPrice}₮
            </Text>
          </>
          
        ) : (
          <Text>Дэлгэрэнгүй мэдээлэл алга байна</Text>
        )}
      </View>
<Text style={{ marginBottom: 6 }}>
  Төлбөрийн төрөл: {items[0]?.payment_method || "Сонгоогүй"}
</Text>

<Text style={{ marginBottom: 6 }}>
  Тайлбар: {items[0]?.payment_note || "-"}
</Text>
      {profile?.role === "admin" && (
        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "700",
              marginBottom: 12
            }}
          >
            ⚙️ Захиалгын төлөв өөрчлөх
          </Text>

          <View style={{ marginBottom: 10 }}>
            <Button title="💳 Төлбөр авсан" onPress={() => updateStatus("paid")} />
          </View>

          <View style={{ marginBottom: 10 }}>
            <Button title="📦 Дуусгах" onPress={() => updateStatus("completed")} />
          </View>

          <View style={{ marginBottom: 10 }}>
            <Button title="⏳ Pending болгох" onPress={() => updateStatus("pending")} />
          </View>

          <View>
            <Button title="❌ Цуцлах" color="#dc2626" onPress={() => updateStatus("cancelled")} />
          </View>
        </View>
      )}

      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12
        }}
      >
        🛍 Бараанууд
      </Text>

      <FlatList
        data={items}
        scrollEnabled={false}
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
              Захиалгын бараа алга байна
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>
              {item.name}
            </Text>
            <Text style={{ marginBottom: 4 }}>Үнэ: {item.price}₮</Text>
            <Text style={{ marginBottom: 4 }}>Тоо: {item.quantity}</Text>
            <Text style={{ fontWeight: "700" }}>
              Нийлбэр: {Number(item.price) * Number(item.quantity)}₮
            </Text>
          </View>
        )}
      />
    </ScrollView>
  );
}