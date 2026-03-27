import { useEffect, useState } from "react";
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

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const init = async () => {
      const ok = await checkAdmin();
      if (ok) {
        await loadProducts();
        await loadOrders();
      }
      setLoading(false);
    };

    init();
  }, []);

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

        <Text style={{ marginBottom: 12, color: "#6b7280" }}>
          Нийт захиалга: {orders.length}
        </Text>

        {orders.length === 0 ? (
          <Text style={{ color: "#6b7280" }}>Захиалга алга байна</Text>
        ) : (
          orders.map((order) => (
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
<Text>Нийт дүн: {order.total}₮</Text>
<Text style={{ marginBottom: 8 }}>Огноо: {order.created_at}</Text>

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
                  title="✅ Батлах"
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