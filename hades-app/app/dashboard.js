import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL as SERVER_URL } from "../constants/api";
import { getStatusStyle } from "../constants/order-status";
import { card, colors, content, formatCurrency, formatDate, screen, shadow } from "../constants/ui";

const statCard = {
  width: "48%",
  backgroundColor: "#fffdf9",
  borderRadius: 20,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.border,
  marginBottom: 12
};

const quickAction = {
  width: "48%",
  backgroundColor: colors.surfaceStrong,
  borderRadius: 20,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.border,
  marginBottom: 12,
  ...shadow
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
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
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
        Alert.alert("Профайл уншиж чадсангүй", profileData.msg || "Дахин нэвтэрч оролдоно уу.");
        router.replace("/");
        return;
      }

      setProfile(profileData.user);

      const [productsRes, cartRes, ordersRes] = await Promise.all([
        fetch(`${SERVER_URL}/products`),
        fetch(`${SERVER_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${SERVER_URL}/orders/${profileData.user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [productsData, cartData, ordersData] = await Promise.all([
        productsRes.json(),
        cartRes.json(),
        ordersRes.json()
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setCartItems(Array.isArray(cartData) ? cartData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      if (profileData.user.role === "admin") {
        const [statsRes, adminOrdersRes, chartRes] = await Promise.all([
          fetch(`${SERVER_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${SERVER_URL}/admin/orders`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${SERVER_URL}/admin/revenue-chart`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const [statsData, adminOrdersData, chartJson] = await Promise.all([
          statsRes.json(),
          adminOrdersRes.json(),
          chartRes.json()
        ]);

        setAdminStats(statsData || null);
        setAdminOrders(Array.isArray(adminOrdersData) ? adminOrdersData : []);
        setChartData(Array.isArray(chartJson) ? chartJson : []);
      } else {
        setAdminStats(null);
        setAdminOrders([]);
        setChartData([]);
      }
    } catch (error) {
      console.log("DASHBOARD ERROR:", error);
      Alert.alert("Алдаа", "Dashboard мэдээлэл ачааллах үед асуудал гарлаа.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const addToCart = async (productId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Нэвтрэлт шаардлагатай", "Эхлээд систем рүү нэвтэрнэ үү.");
        router.replace("/");
        return;
      }

      const response = await fetch(`${SERVER_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      const data = await response.json();

      if (response.ok && data.message) {
        Alert.alert("Амжилттай", "Бараа сагсанд нэмэгдлээ.");
        loadDashboard(true);
        return;
      }

      Alert.alert("Алдаа", data.msg || "Сагсанд нэмэх үед алдаа гарлаа.");
    } catch (error) {
      console.log("ADD TO CART ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
    }
  };

  if (loading) {
    return (
      <View style={[screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Dashboard ачааллаж байна...</Text>
      </View>
    );
  }

  const pendingAdminOrders = adminOrders.filter((item) => (item.status || "pending") === "pending");
  const myTotalAmount = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <ScrollView
      style={screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />}
    >
      <View style={content}>
        <View
          style={{
            backgroundColor: colors.primaryDark,
            borderRadius: 30,
            padding: 22,
            marginBottom: 16
          }}
        >
          <Text style={{ color: "#fdba74", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>
            CONTROL CENTER
          </Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 8 }}>
            Сайн байна, {profile?.username}
          </Text>
          <Text style={{ color: "#ffedd5", lineHeight: 22 }}>
            Захиалга, бараа, төлбөрийн төлөвөө эндээс хянаарай.
          </Text>
        </View>

        <View style={[card, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12 }}>
            Хэрэглэгчийн мэдээлэл
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Нэвтрэх нэр: {profile?.username}</Text>
          <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Хэрэглэгчийн ID: {profile?.id}</Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: profile?.role === "admin" ? "#fee2e2" : "#dbeafe",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999
            }}
          >
            <Text
              style={{
                color: profile?.role === "admin" ? colors.danger : "#1d4ed8",
                fontWeight: "800"
              }}
            >
              {profile?.role === "admin" ? "Админ эрхтэй" : "Хэрэглэгч"}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 4 }}>
          <View style={statCard}>
            <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Барааны тоо</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>{products.length}</Text>
          </View>
          <View style={statCard}>
            <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Сагсанд</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>{cartItems.length}</Text>
          </View>
          <View style={statCard}>
            <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Миний захиалга</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>{orders.length}</Text>
          </View>
          <View style={statCard}>
            <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Нийт дүн</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{formatCurrency(myTotalAmount)}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 12, marginTop: 6 }}>
          Түргэн үйлдлүүд
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 }}>
          <TouchableOpacity style={quickAction} onPress={() => router.push("/cart")} activeOpacity={0.9}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 4 }}>Сагс</Text>
            <Text style={{ color: colors.textMuted }}>Сонгосон бараагаа шалгах</Text>
          </TouchableOpacity>
          <TouchableOpacity style={quickAction} onPress={() => router.push("/orders")} activeOpacity={0.9}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 4 }}>Захиалга</Text>
            <Text style={{ color: colors.textMuted }}>Өмнөх болон шинэ захиалга</Text>
          </TouchableOpacity>
          <TouchableOpacity style={quickAction} onPress={() => router.push("/profile")} activeOpacity={0.9}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 4 }}>Профайл</Text>
            <Text style={{ color: colors.textMuted }}>Хэрэглэгчийн мэдээлэл</Text>
          </TouchableOpacity>
          <TouchableOpacity style={quickAction} onPress={() => loadDashboard(true)} activeOpacity={0.9}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 4 }}>Шинэчлэх</Text>
            <Text style={{ color: colors.textMuted }}>Сүүлийн мэдээлэл татах</Text>
          </TouchableOpacity>
          {profile?.role === "admin" ? (
            <TouchableOpacity
              style={[quickAction, { width: "100%", backgroundColor: "#fff7ed" }]}
              onPress={() => router.push("/admin")}
              activeOpacity={0.9}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primaryDark, marginBottom: 4 }}>
                Admin panel
              </Text>
              <Text style={{ color: colors.warning }}>Бараа, төлөв, захиалгын урсгал удирдах</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {profile?.role === "admin" && adminStats ? (
          <View style={[card, { marginBottom: 16, backgroundColor: "#172033" }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "white", marginBottom: 12 }}>
              Админы хяналтын самбар
            </Text>
            <Text style={{ color: "#cbd5e1", marginBottom: 8 }}>Нийт захиалга: {adminStats.totalOrders}</Text>
            <Text style={{ color: "#cbd5e1", marginBottom: 8 }}>
              Нийт орлого: {formatCurrency(adminStats.totalRevenue || 0)}
            </Text>
            <Text style={{ color: "#cbd5e1", marginBottom: 8 }}>
              Хүлээгдэж буй захиалга: {adminStats.pendingOrders}
            </Text>
            <Text style={{ color: "#cbd5e1" }}>Нийт хэрэглэгчийн захиалга: {adminOrders.length}</Text>
          </View>
        ) : null}

        {profile?.role === "admin" && chartData.length > 0 ? (
          <View style={[card, { marginBottom: 16 }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12 }}>
              Орлогын 7 хоногийн тойм
            </Text>
            {chartData.map((item, index) => (
              <View
                key={`${item.day}-${index}`}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: index === chartData.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border
                }}
              >
                <Text style={{ color: colors.text }}>{item.day}</Text>
                <Text style={{ color: colors.primaryDark, fontWeight: "800" }}>{formatCurrency(item.revenue)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[card, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12 }}>
            Сүүлийн захиалгууд
          </Text>
          {orders.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>Одоогоор захиалга үүсээгүй байна.</Text>
          ) : (
            orders.slice(0, 5).map((order) => {
              const statusStyle = getStatusStyle(order.status || "pending");
              return (
                <TouchableOpacity
                  key={order.id}
                  onPress={() =>
                    router.push({
                      pathname: "/order-details",
                      params: { orderId: String(order.id) }
                    })
                  }
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: "#faf7f1",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
                    Захиалга #{order.id}
                  </Text>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: statusStyle.backgroundColor,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginBottom: 8
                    }}
                  >
                    <Text style={{ color: statusStyle.color, fontWeight: "800" }}>{statusStyle.label}</Text>
                  </View>
                  <Text style={{ color: colors.textMuted, marginBottom: 4 }}>Нийт: {formatCurrency(order.total)}</Text>
                  <Text style={{ color: colors.textMuted }}>Огноо: {formatDate(order.created_at)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {profile?.role === "admin" && pendingAdminOrders.length > 0 ? (
          <View style={[card, { marginBottom: 16 }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12 }}>
              Хүлээгдэж буй захиалгууд
            </Text>
            {pendingAdminOrders.slice(0, 5).map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() =>
                  router.push({
                    pathname: "/order-details",
                    params: { orderId: String(order.id) }
                  })
                }
                activeOpacity={0.9}
                style={{
                  backgroundColor: "#fff7ed",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#fed7aa"
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
                  Захиалга #{order.id}
                </Text>
                <Text style={{ color: colors.textMuted }}>Хэрэглэгч: {order.username}</Text>
                <Text style={{ color: colors.textMuted }}>Нийт: {formatCurrency(order.total)}</Text>
                <Text style={{ color: colors.textMuted }}>Огноо: {formatDate(order.created_at)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text, marginBottom: 12 }}>
          Бүтээгдэхүүнүүд
        </Text>

        {products.map((item) => (
          <View
            key={item.id}
            style={[
              card,
              {
                padding: 0,
                overflow: "hidden",
                marginBottom: 16
              }
            ]}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
            ) : (
              <View
                style={{
                  height: 200,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surfaceMuted
                }}
              >
                <Text style={{ color: colors.textMuted }}>Зураггүй бараа</Text>
              </View>
            )}
            <View style={{ padding: 18 }}>
              <Text style={{ fontSize: 21, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
                {item.name}
              </Text>
              <Text style={{ color: colors.primaryDark, fontSize: 18, fontWeight: "800", marginBottom: 14 }}>
                {formatCurrency(item.price)}
              </Text>
              <TouchableOpacity
                onPress={() => addToCart(item.id)}
                activeOpacity={0.9}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Сагсанд нэмэх</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
