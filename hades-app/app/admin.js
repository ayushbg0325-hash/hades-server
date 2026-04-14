import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL as SERVER_URL } from "../constants/api";
import { getStatusStyle } from "../constants/order-status";
import { card, colors, content, formatCurrency, formatDate, input, screen } from "../constants/ui";

const summaryCard = {
  width: "48%",
  backgroundColor: "#fffdf9",
  borderRadius: 18,
  padding: 14,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: colors.border
};

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const checkAdmin = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/");
        return false;
      }

      const response = await fetch(`${SERVER_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok || !data.user || data.user.role !== "admin") {
        router.replace("/dashboard");
        return false;
      }

      return true;
    } catch (error) {
      console.log("ADMIN CHECK ERROR:", error);
      router.replace("/dashboard");
      return false;
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/products`);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("LOAD PRODUCTS ERROR:", error);
    }
  };

  const loadOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${SERVER_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("LOAD ADMIN ORDERS ERROR:", error);
      Alert.alert("Алдаа", "Захиалгуудыг ачаалж чадсангүй.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setLoading(true);
        const ok = await checkAdmin();
        if (ok) {
          await loadProducts();
          await loadOrders();
        }
        setLoading(false);
      };

      init();
    }, [])
  );

  const saveProduct = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const url = editingId ? `${SERVER_URL}/products/${editingId}` : `${SERVER_URL}/products`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          image
        })
      });
      const data = await response.json();

      if (response.ok && data.message) {
        setName("");
        setPrice("");
        setImage("");
        setEditingId(null);
        loadProducts();
        return;
      }

      Alert.alert("Алдаа", data.msg || "Бараа хадгалах үед алдаа гарлаа.");
    } catch (error) {
      console.log("SAVE PRODUCT ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
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
        loadOrders();
        return;
      }

      Alert.alert("Алдаа", data.msg || "Захиалгын төлөв шинэчилж чадсангүй.");
    } catch (error) {
      console.log("UPDATE ORDER STATUS ERROR:", error);
      Alert.alert("Алдаа", "Төлөв шинэчлэх үед асуудал гарлаа.");
    }
  };

  const deleteProduct = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${SERVER_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.message) {
        loadProducts();
        return;
      }

      Alert.alert("Алдаа", data.msg || "Барааг устгаж чадсангүй.");
    } catch (error) {
      console.log("DELETE PRODUCT ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
    }
  };

  const filteredOrders = orders
    .filter((order) => (statusFilter === "all" ? true : (order.status || "pending") === statusFilter))
    .filter((order) => {
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return (
        String(order.id).includes(q) ||
        String(order.user_id).includes(q) ||
        String(order.username || "").toLowerCase().includes(q)
      );
    })
    .filter((order) => {
      if (dateFilter === "all") return true;
      const created = new Date(order.created_at);
      const now = new Date();
      if (dateFilter === "today") return created.toDateString() === now.toDateString();
      if (dateFilter === "7days") return (now - created) / (1000 * 60 * 60 * 24) <= 7;
      return true;
    });

  const summary = {
    total: filteredOrders.length,
    revenue: filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    pending: filteredOrders.filter((o) => (o.status || "pending") === "pending").length,
    paid: filteredOrders.filter((o) => (o.status || "pending") === "paid").length,
    completed: filteredOrders.filter((o) => (o.status || "pending") === "completed").length,
    cancelled: filteredOrders.filter((o) => (o.status || "pending") === "cancelled").length
  };

  if (loading) {
    return (
      <View style={[screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Admin panel ачааллаж байна...</Text>
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
          <Text style={{ color: "#fdba74", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>ADMIN PANEL</Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 8 }}>
            Захиалга ба барааны удирдлага
          </Text>
          <Text style={{ color: "#ffedd5", lineHeight: 22 }}>
            Админ талаас бараа нэмэх, засах, устгах болон төлбөрийн төлөв шинэчлэх хэсэг.
          </Text>
        </View>

        <View style={[card, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 14 }}>
            Бараа нэмэх эсвэл засах
          </Text>
          <TextInput
            placeholder="Барааны нэр"
            placeholderTextColor={colors.textSoft}
            value={name}
            onChangeText={setName}
            style={[input, { marginBottom: 12 }]}
          />
          <TextInput
            placeholder="Үнэ"
            placeholderTextColor={colors.textSoft}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            style={[input, { marginBottom: 12 }]}
          />
          <TextInput
            placeholder="Зургийн URL"
            placeholderTextColor={colors.textSoft}
            value={image}
            onChangeText={setImage}
            style={[input, { marginBottom: 14 }]}
          />
          <TouchableOpacity
            onPress={saveProduct}
            activeOpacity={0.9}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center"
            }}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>
              {editingId ? "Өөрчлөлт хадгалах" : "Шинэ бараа нэмэх"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[card, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: 14 }}>
            Захиалгын шүүлтүүр ба тойм
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 4 }}>
            <View style={summaryCard}>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Захиалга</Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>{summary.total}</Text>
            </View>
            <View style={summaryCard}>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Орлого</Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>{formatCurrency(summary.revenue)}</Text>
            </View>
            <View style={summaryCard}>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Pending</Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>{summary.pending}</Text>
            </View>
            <View style={summaryCard}>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Paid</Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>{summary.paid}</Text>
            </View>
            <View style={summaryCard}>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Completed</Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>{summary.completed}</Text>
            </View>
            <View style={summaryCard}>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Cancelled</Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>{summary.cancelled}</Text>
            </View>
          </View>

          <TextInput
            placeholder="Order ID, User ID, Username хайх"
            placeholderTextColor={colors.textSoft}
            value={searchText}
            onChangeText={setSearchText}
            style={[input, { marginBottom: 12 }]}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                ["all", "Бүх огноо"],
                ["today", "Өнөөдөр"],
                ["7days", "Сүүлийн 7 хоног"]
              ].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setDateFilter(key)}
                  style={{
                    backgroundColor: dateFilter === key ? colors.accent : colors.surfaceMuted,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999
                  }}
                >
                  <Text style={{ color: dateFilter === key ? "white" : colors.text, fontWeight: "800" }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                ["all", "Бүгд"],
                ["pending", "Pending"],
                ["paid", "Paid"],
                ["completed", "Completed"],
                ["cancelled", "Cancelled"]
              ].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setStatusFilter(key)}
                  style={{
                    backgroundColor: statusFilter === key ? colors.primary : colors.surfaceMuted,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999
                  }}
                >
                  <Text style={{ color: statusFilter === key ? "white" : colors.text, fontWeight: "800" }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: 12 }}>
          Хэрэглэгчийн захиалгууд
        </Text>
        {filteredOrders.map((order) => {
          const status = getStatusStyle(order.status || "pending");
          return (
            <View key={order.id} style={[card, { marginBottom: 14 }]}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/order-details",
                    params: { orderId: String(order.id) }
                  })
                }
                activeOpacity={0.9}
              >
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
                  Захиалга #{order.id}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 4 }}>User ID: {order.user_id}</Text>
                <Text style={{ color: colors.textMuted, marginBottom: 4 }}>Username: {order.username}</Text>
                <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                  Төлбөрийн төрөл: {order.payment_method || "Сонгоогүй"}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                  Тайлбар: {order.payment_note || "-"}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                  Нийт дүн: {formatCurrency(order.total)}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 10 }}>
                  Огноо: {formatDate(order.created_at)}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: status.backgroundColor,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginBottom: 12
                  }}
                >
                  <Text style={{ color: status.color, fontWeight: "800" }}>{status.label}</Text>
                </View>
              </TouchableOpacity>

              {[
                ["paid", "Төлбөр батлах", "#2563eb"],
                ["completed", "Хүргэлт дуусгах", "#16a34a"],
                ["cancelled", "Цуцлах", "#dc2626"]
              ].map(([key, label, bg]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => updateOrderStatus(order.id, key)}
                  style={{
                    backgroundColor: bg,
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                    marginBottom: 8
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "800" }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: 12, marginTop: 8 }}>
          Барааны жагсаалт
        </Text>
        {products.map((item) => (
          <View key={item.id} style={[card, { padding: 0, overflow: "hidden", marginBottom: 14 }]}>
            {item.image ? <Image source={{ uri: item.image }} style={{ width: "100%", height: 180 }} resizeMode="cover" /> : null}
            <View style={{ padding: 18 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 6 }}>{item.name}</Text>
              <Text style={{ color: colors.primaryDark, fontWeight: "900", marginBottom: 14 }}>
                {formatCurrency(item.price)}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setEditingId(item.id);
                  setName(item.name);
                  setPrice(String(item.price));
                  setImage(item.image || "");
                }}
                style={{
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginBottom: 8
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "800" }}>Засах</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteProduct(item.id)}
                style={{
                  backgroundColor: "#fee2e2",
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: colors.danger, fontWeight: "800" }}>Устгах</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
