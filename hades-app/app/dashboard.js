import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminOrders, setAdminOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

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

      if (!profileRes.ok || !profileData.user) {
        Alert.alert("Алдаа", profileData.msg || "Profile уншиж чадсангүй");
        router.replace("/");
        return;
      }

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

      // 4. Миний orders
      const ordersRes = await fetch(`${SERVER_URL}/orders/${profileData.user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      // 5. Admin data
      if (profileData.user.role === "admin") {
        const statsRes = await fetch(`${SERVER_URL}/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const statsData = await statsRes.json();
        setAdminStats(statsData);

        const adminOrdersRes = await fetch(`${SERVER_URL}/admin/orders`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const adminOrdersData = await adminOrdersRes.json();
        setAdminOrders(Array.isArray(adminOrdersData) ? adminOrdersData : []);

        const chartRes = await fetch(`${SERVER_URL}/admin/revenue-chart`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const chartJson = await chartRes.json();
        setChartData(Array.isArray(chartJson) ? chartJson : []);
      } else {
        setAdminStats(null);
        setAdminOrders([]);
        setChartData([]);
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

  const pendingAdminOrders = adminOrders.filter(
    (o) => (o.status || "pending") === "pending"
  );

  const myTotalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
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
    👤 Одоогоор нэвтэрсэн хэрэглэгч
  </Text>

  <Text style={{ marginBottom: 6 }}>
    Username: {profile?.username}
  </Text>

  <Text style={{ marginBottom: 6 }}>
    User ID: {profile?.id}
  </Text>

  <View
    style={{
      alignSelf: "flex-start",
      backgroundColor: profile?.role === "admin" ? "#fee2e2" : "#dbeafe",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      marginTop: 6
    }}
  >
    <Text
      style={{
        color: profile?.role === "admin" ? "#b91c1c" : "#1d4ed8",
        fontWeight: "700"
      }}
    >
      {profile?.role === "admin" ? "ADMIN" : "USER"}
    </Text>
  </View>
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

          <View style={{ marginBottom: 10 }}>
            <Button title="🔄 Refresh" onPress={loadDashboard} />
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

          <View style={statCard}>
            <Text style={statTitle}>Миний нийт дүн</Text>
            <Text style={statValueSmall}>{myTotalAmount}₮</Text>
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

            <Text style={{ color: "#d1d5db", marginBottom: 8 }}>
              Нийт захиалга: {adminStats.totalOrders}
            </Text>
            <Text style={{ color: "#d1d5db", marginBottom: 8 }}>
              Нийт орлого: {adminStats.totalRevenue || 0}₮
            </Text>
            <Text style={{ color: "#d1d5db", marginBottom: 8 }}>
              Хүлээгдэж буй захиалга: {adminStats.pendingOrders}
            </Text>
            <Text style={{ color: "#d1d5db" }}>
              Бүх хэрэглэгчийн захиалга: {adminOrders.length}
            </Text>
          </View>
        )}

        {/* REVENUE CHART LIST */}
        {profile?.role === "admin" && chartData.length > 0 && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 14,
              padding: 16,
              marginBottom: 16
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
              📈 Орлогын график
            </Text>

            {chartData.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: index === chartData.length - 1 ? 0 : 1,
                  borderBottomColor: "#e5e7eb"
                }}
              >
                <Text>{item.day}</Text>
                <Text style={{ fontWeight: "700" }}>{item.revenue}₮</Text>
              </View>
            ))}
          </View>
        )}

        {/* MY RECENT ORDERS */}
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
            📦 Миний сүүлийн захиалгууд
          </Text>

          {orders.length === 0 ? (
            <Text style={{ color: "#6b7280" }}>Захиалга алга байна</Text>
          ) : (
            orders.slice(0, 5).map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() =>
                  router.push({
                    pathname: "/order-details",
                    params: { orderId: String(order.id) }
                  })
                }
                style={{
                  backgroundColor: "#f9fafb",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10
                }}
              >
                <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                  Order #{order.id}
                </Text>

                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: getStatusStyle(order.status || "pending").backgroundColor,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    marginBottom: 8
                  }}
                >
                  <Text
                    style={{
                      color: getStatusStyle(order.status || "pending").color,
                      fontWeight: "700"
                    }}
                  >
                    {getStatusStyle(order.status || "pending").label}
                  </Text>
                </View>

                <Text>Нийт дүн: {order.total}₮</Text>
                <Text>Огноо: {order.created_at}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ADMIN PENDING ORDERS */}
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
              ⏳ Хүлээгдэж буй бүх захиалгууд
            </Text>

            {pendingAdminOrders.length === 0 ? (
              <Text style={{ color: "#6b7280" }}>
                Хүлээгдэж буй захиалга алга байна
              </Text>
            ) : (
              pendingAdminOrders.slice(0, 5).map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() =>
                    router.push({
                      pathname: "/order-details",
                      params: { orderId: String(order.id) }
                    })
                  }
                  style={{
                    backgroundColor: "#fff7ed",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10
                  }}
                >
                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                    Order #{order.id}
                  </Text>
                  <Text>User ID: {order.user_id}</Text>
                  <Text>Username: {order.username}</Text>
                  <Text>Нийт дүн: {order.total}₮</Text>
                  <Text>Огноо: {order.created_at}</Text>
                </TouchableOpacity>
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
  width: "48%",
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

const statValueSmall = {
  fontSize: 18,
  fontWeight: "bold"
};