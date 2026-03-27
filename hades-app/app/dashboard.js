import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  Image,
  ScrollView,
  Alert
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL = "https://hades-server.onrender.com";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        router.replace("/");
        return;
      }

      // 1. Profile
      const profileRes = await fetch(`${SERVER_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const profileData = await profileRes.json();
      setProfile(profileData.user);

      // 2. Products
      const productsRes = await fetch(`${SERVER_URL}/products`);
      const productsData = await productsRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);

      // 3. Cart
      const cartRes = await fetch(`${SERVER_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const cartData = await cartRes.json();
      setCartItems(Array.isArray(cartData) ? cartData : []);

      // 4. Orders
      const ordersRes = await fetch(`${SERVER_URL}/orders/${profileData.user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      // 5. Admin stats (admin user бол)
      if (profileData.user.role === "admin") {
        const statsRes = await fetch(`${SERVER_URL}/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const statsData = await statsRes.json();
        setAdminStats(statsData);
      }
    } catch (error) {
      console.log("DASHBOARD ERROR:", error);
      Alert.alert("Алдаа", "Dashboard уншихад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const addToCart = async (productId) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        router.replace("/");
        return;
      }

      const response = await fetch(`${SERVER_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      });

      const data = await response.json();

      if (data.message) {
        Alert.alert("Амжилттай", "Сагсанд нэмэгдлээ");
        loadDashboard();
      } else {
        Alert.alert("Алдаа", data.msg || "Сагсанд нэмэж чадсангүй");
      }
    } catch (error) {
      console.log("ADD TO CART ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Түр хүлээнэ үү...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <View style={{ padding: 16, paddingTop: 30 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20
          }}
        >
          📊 Dashboard
        </Text>

        {/* USER INFO */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
            👤 Хэрэглэгчийн мэдээлэл
          </Text>
          <Text>Username: {profile?.username}</Text>
          <Text>User ID: {profile?.id}</Text>
          <Text>Role: {profile?.role}</Text>
        </View>

        {/* QUICK ACTIONS */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ marginBottom: 10 }}>
            <Button title="🛒 Cart руу орох" onPress={() => router.push("/cart")} />
          </View>

          {profile?.role === "admin" && (
            <View style={{ marginBottom: 10 }}>
              <Button title="🛠 Admin Panel" onPress={() => router.push("/admin")} />
            </View>
          )}

          <View style={{ marginBottom: 10 }}>
            <Button title="📦 Захиалгын түүх" onPress={() => router.push("/orders")} />
          </View>

          <View style={{ marginBottom: 10 }}>
            <Button title="👤 Profile" onPress={() => router.push("/profile")} />
          </View>
        </View>

        {/* BASIC STATS */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: 16
          }}
        >
          <View style={statCard}>
            <Text style={statTitle}>Бүтээгдэхүүн</Text>
            <Text style={statValue}>{products.length}</Text>
          </View>

          <View style={statCard}>
            <Text style={statTitle}>Сагсанд</Text>
            <Text style={statValue}>{cartItems.length}</Text>
          </View>

          <View style={statCard}>
            <Text style={statTitle}>Миний захиалга</Text>
            <Text style={statValue}>{orders.length}</Text>
          </View>
        </View>

        {/* ADMIN STATS */}
        {profile?.role === "admin" && adminStats && (
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
                marginBottom: 14
              }}
            >
              📈 Admin статистик
            </Text>

            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: "#d1d5db" }}>
                Нийт захиалга: {adminStats.totalOrders}
              </Text>
            </View>

            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: "#d1d5db" }}>
                Нийт орлого: {adminStats.totalRevenue || 0}₮
              </Text>
            </View>

            <View>
              <Text style={{ color: "#d1d5db" }}>
                Хүлээгдэж буй захиалга: {adminStats.pendingOrders}
              </Text>
            </View>
          </View>
        )}
{/* MY ORDERS LIST */}
<View
  style={{
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16
  }}
>
  <Text
    style={{
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 12
    }}
  >
    📦 Миний захиалгууд
  </Text>

  {orders.length === 0 ? (
    <Text style={{ color: "#6b7280" }}>Захиалга алга байна</Text>
  ) : (
    orders.slice(0, 5).map((order) => (
      <View
        key={order.id}
        style={{
          backgroundColor: "#f9fafb",
          borderRadius: 10,
          padding: 12,
          marginBottom: 10
        }}
      >
        <Text style={{ fontWeight: "700" }}>Order #{order.id}</Text>
        <Text>Нийт дүн: {order.total}₮</Text>
        <Text>Төлөв: {order.status || "pending"}</Text>
        <Text>Огноо: {order.created_at}</Text>
      </View>
    ))
  )}
</View>

{/* PENDING ORDERS LIST - ADMIN ONLY */}
{profile?.role === "admin" && (
  <View
    style={{
      backgroundColor: "white",
      borderRadius: 14,
      padding: 16,
      marginBottom: 16
    }}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12
      }}
    >
      ⏳ Хүлээгдэж буй захиалгууд
    </Text>

    {orders.filter((o) => (o.status || "pending") === "pending").length === 0 ? (
      <Text style={{ color: "#6b7280" }}>Хүлээгдэж буй захиалга алга байна</Text>
    ) : (
      orders
        .filter((o) => (o.status || "pending") === "pending")
        .slice(0, 5)
        .map((order) => (
          <View
            key={order.id}
            style={{
              backgroundColor: "#fff7ed",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10
            }}
          >
            <Text style={{ fontWeight: "700" }}>Order #{order.id}</Text>
            <Text>Нийт дүн: {order.total}₮</Text>
            <Text>Төлөв: {order.status || "pending"}</Text>
            <Text>Огноо: {order.created_at}</Text>
          </View>
        ))
    )}
  </View>
)}
        {/* PRODUCTS */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 12,
            textAlign: "center"
          }}
        >
          🛍 Бүтээгдэхүүнүүд
        </Text>

        <FlatList
          data={products}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 14,
                marginBottom: 16,
                overflow: "hidden"
              }}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: "100%",
                    height: 180
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 180,
                    backgroundColor: "#d1d5db",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#6b7280" }}>No Image</Text>
                </View>
              )}

              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: "700" }}>
                  {item.name}
                </Text>

                <Text style={{ marginTop: 8, fontSize: 16, color: "#4b5563" }}>
                  Үнэ: {item.price}₮
                </Text>

                <View style={{ marginTop: 12 }}>
                  <Button
                    title="🛒 Сагсанд нэмэх"
                    onPress={() => addToCart(item.id)}
                  />
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const statCard = {
  width: "31%",
  backgroundColor: "white",
  borderRadius: 12,
  padding: 14,
  marginBottom: 12
};

const statTitle = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 8
};

const statValue = {
  fontSize: 24,
  fontWeight: "bold"
};
