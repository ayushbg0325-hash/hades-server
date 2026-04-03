import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

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

const summaryCard = {
  width: "31%",
  backgroundColor: "#f9fafb",
  borderRadius: 14,
  padding: 14,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#e5e7eb"
};

const summaryLabel = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 8
};

const summaryValue = {
  fontSize: 20,
  fontWeight: "700",
  color: "#111827"
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
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        router.replace("/");
        return false;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role !== "admin") {
        Alert.alert("Алдаа", "Admin эрхгүй байна");
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
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("ADMIN ORDERS STATUS:", response.status);

      const data = await response.json();
      console.log("ADMIN ORDERS DATA:", data);

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("LOAD ADMIN ORDERS ERROR:", error);
      Alert.alert("Алдаа", "Захиалгуудыг уншиж чадсангүй");
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

      const url = editingId
        ? `${SERVER_URL}/products/${editingId}`
        : `${SERVER_URL}/products`;

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

      if (data.message) {
        Alert.alert(
          "Амжилттай",
          editingId ? "Product шинэчлэгдлээ" : "Product нэмэгдлээ"
        );
        setName("");
        setPrice("");
        setImage("");
        setEditingId(null);
        loadProducts();
      } else {
        Alert.alert("Алдаа", data.msg || "Алдаа гарлаа");
      }
    } catch (error) {
      console.log("SAVE PRODUCT ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
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
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (data.message) {
        Alert.alert("Амжилттай", data.message);
        loadOrders();
      } else {
        Alert.alert("Алдаа", data.msg || "Status өөрчилж чадсангүй");
      }
    } catch (error) {
      console.log("UPDATE ORDER STATUS ERROR:", error);
      Alert.alert("Алдаа", "Status update хийхэд алдаа гарлаа");
    }
  };

  const deleteProduct = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${SERVER_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.message) {
        Alert.alert("Амжилттай", "Product устгалаа");
        loadProducts();
      } else {
        Alert.alert("Алдаа", "Устгаж чадсангүй");
      }
    } catch (error) {
      console.log("DELETE PRODUCT ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter === "all") return true;
      return (order.status || "pending") === statusFilter;
    })
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

      if (dateFilter === "today") {
        return created.toDateString() === now.toDateString();
      }

      if (dateFilter === "7days") {
        const diff = now - created;
        const days = diff / (1000 * 60 * 60 * 24);
        return days <= 7;
      }

      return true;
    });

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const pendingCount = filteredOrders.filter(
    (o) => (o.status || "pending") === "pending"
  ).length;

  const paidCount = filteredOrders.filter(
    (o) => (o.status || "pending") === "paid"
  ).length;

  const completedCount = filteredOrders.filter(
    (o) => (o.status || "pending") === "completed"
  ).length;

  const cancelledCount = filteredOrders.filter(
    (o) => (o.status || "pending") === "cancelled"
  ).length;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Түр хүлээнэ үү...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        🛠 Admin Panel
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Button
          title="🔄 Захиалга refresh"
          onPress={async () => {
            setLoading(true);
            await loadOrders();
            setLoading(false);
          }}
        />
      </View>

      <View
        style={{
          backgroundColor: "white",
          padding: 16,
          borderRadius: 12,
          marginBottom: 20
        }}
      >
        <TextInput
          placeholder="Product name"
          value={name}
          onChangeText={setName}
          style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8 }}
        />

        <TextInput
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8 }}
        />

        <TextInput
          placeholder="Image URL"
          value={image}
          onChangeText={setImage}
          style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8 }}
        />

        <Button
          title={editingId ? "💾 Update Product" : "➕ Add Product"}
          onPress={saveProduct}
        />
      </View>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
          📦 Хэрэглэгчдийн захиалга
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: 16
          }}
        >
          <View style={summaryCard}>
            <Text style={summaryLabel}>Нийт order</Text>
            <Text style={summaryValue}>{filteredOrders.length}</Text>
          </View>

          <View style={summaryCard}>
            <Text style={summaryLabel}>Нийт дүн</Text>
            <Text style={summaryValue}>{totalRevenue}₮</Text>
          </View>

          <View style={summaryCard}>
            <Text style={summaryLabel}>Pending</Text>
            <Text style={summaryValue}>{pendingCount}</Text>
          </View>

          <View style={summaryCard}>
            <Text style={summaryLabel}>Paid</Text>
            <Text style={summaryValue}>{paidCount}</Text>
          </View>

          <View style={summaryCard}>
            <Text style={summaryLabel}>Completed</Text>
            <Text style={summaryValue}>{completedCount}</Text>
          </View>

          <View style={summaryCard}>
            <Text style={summaryLabel}>Cancelled</Text>
            <Text style={summaryValue}>{cancelledCount}</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 14,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#e5e7eb"
          }}
        >
          <TextInput
            placeholder="Order ID, User ID, Username хайх..."
            value={searchText}
            onChangeText={setSearchText}
            style={{ fontSize: 16 }}
          />
        </View>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 8,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10
            }}
          >
            <TouchableOpacity
              onPress={() => setDateFilter("all")}
              style={{
                backgroundColor: dateFilter === "all" ? "#111827" : "#f3f4f6",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999
              }}
            >
              <Text
                style={{
                  color: dateFilter === "all" ? "#fff" : "#111827",
                  fontWeight: "700"
                }}
              >
                Бүх огноо
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDateFilter("today")}
              style={{
                backgroundColor: dateFilter === "today" ? "#2563eb" : "#eff6ff",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999
              }}
            >
              <Text
                style={{
                  color: dateFilter === "today" ? "#fff" : "#1d4ed8",
                  fontWeight: "700"
                }}
              >
                Өнөөдөр
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDateFilter("7days")}
              style={{
                backgroundColor: dateFilter === "7days" ? "#16a34a" : "#f0fdf4",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999
              }}
            >
              <Text
                style={{
                  color: dateFilter === "7days" ? "#fff" : "#166534",
                  fontWeight: "700"
                }}
              >
                Сүүлийн 7 хоног
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 8,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10
            }}
          >
            <TouchableOpacity
              onPress={() => setStatusFilter("all")}
              style={{
                backgroundColor: statusFilter === "all" ? "#111827" : "#f3f4f6",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                minWidth: 90,
                alignItems: "center"
              }}
            >
              <Text
                style={{
                  color: statusFilter === "all" ? "#fff" : "#111827",
                  fontWeight: "700"
                }}
              >
                ⚫ Бүгд
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("pending")}
              style={{
                backgroundColor: statusFilter === "pending" ? "#dc2626" : "#fef2f2",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                minWidth: 100,
                alignItems: "center"
              }}
            >
              <Text
                style={{
                  color: statusFilter === "pending" ? "#fff" : "#b91c1c",
                  fontWeight: "700"
                }}
              >
                🔴 Pending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("paid")}
              style={{
                backgroundColor: statusFilter === "paid" ? "#2563eb" : "#eff6ff",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                minWidth: 90,
                alignItems: "center"
              }}
            >
              <Text
                style={{
                  color: statusFilter === "paid" ? "#fff" : "#1d4ed8",
                  fontWeight: "700"
                }}
              >
                🔵 Paid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("completed")}
              style={{
                backgroundColor: statusFilter === "completed" ? "#16a34a" : "#f0fdf4",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                minWidth: 120,
                alignItems: "center"
              }}
            >
              <Text
                style={{
                  color: statusFilter === "completed" ? "#fff" : "#166534",
                  fontWeight: "700"
                }}
              >
                🟢 Completed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter("cancelled")}
              style={{
                backgroundColor: statusFilter === "cancelled" ? "#7f1d1d" : "#fef2f2",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                minWidth: 110,
                alignItems: "center"
              }}
            >
              <Text
                style={{
                  color: statusFilter === "cancelled" ? "#fff" : "#991b1b",
                  fontWeight: "700"
                }}
              >
                ❌ Cancelled
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <Text style={{ marginBottom: 12, color: "#6b7280" }}>
          Нийт захиалга: {orders.length}
        </Text>

        {filteredOrders.length === 0 ? (
          <Text style={{ color: "#6b7280" }}>
            Тохирох захиалга олдсонгүй
          </Text>
        ) : (
          filteredOrders.map((order) => (
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
                marginBottom: 12
              }}
            >
              <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                Order #{order.id}
              </Text>

              <Text>User ID: {order.user_id}</Text>
              <Text>Username: {order.username}</Text>
              <Text>Төлбөрийн төрөл: {order.payment_method || "Сонгоогүй"}</Text>
<Text>Тайлбар: {order.payment_note || "-"}</Text>
              <Text>Нийт дүн: {order.total}₮</Text>
              <Text style={{ marginBottom: 8 }}>
                Огноо: {order.created_at}
              </Text>

              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: getStatusStyle(order.status || "pending").backgroundColor,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  marginBottom: 10
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

              <View style={{ marginBottom: 8 }}>
                <Button
                  title="💳 Төлбөр авсан"
                  onPress={() => updateOrderStatus(order.id, "paid")}
                />
              </View>

              <View style={{ marginBottom: 8 }}>
                <Button
                  title="📦 Дуусгах"
                  onPress={() => updateOrderStatus(order.id, "completed")}
                />
              </View>

              <View>
                <Button
                  title="❌ Цуцлах"
                  color="#dc2626"
                  onPress={() => updateOrderStatus(order.id, "cancelled")}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <FlatList
        data={products}
        scrollEnabled={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              marginBottom: 12,
              overflow: "hidden"
            }}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: "100%", height: 180 }}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
              <Text style={{ marginTop: 6 }}>{item.price}₮</Text>

              <View style={{ marginTop: 12 }}>
                <Button
                  title="✏️ Edit"
                  onPress={() => {
                    setEditingId(item.id);
                    setName(item.name);
                    setPrice(String(item.price));
                    setImage(item.image || "");
                  }}
                />
              </View>

              <View style={{ marginTop: 10 }}>
                <Button
                  title="❌ Delete"
                  color="#dc2626"
                  onPress={() => deleteProduct(item.id)}
                />
              </View>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}