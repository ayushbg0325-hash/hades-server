import { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const SERVER_URL = "https://hades-server.onrender.com";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        setLoading(false);
        return;
      }

      const response = await fetch(`${SERVER_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("CART DATA:", data);

      if (response.ok) {
        setCartItems(Array.isArray(data) ? data : []);
      } else {
        Alert.alert("Алдаа", data.msg || "Сагс ачаалж чадсангүй");
      }
    } catch (error) {
      console.log("LOAD CART ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeFromCart = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${SERVER_URL}/cart/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.message) {
        Alert.alert("Амжилттай", data.message);
        loadCart();
      } else {
        Alert.alert("Алдаа", data.msg || "Сагснаас устгаж чадсангүй");
      }
    } catch (error) {
      console.log("REMOVE CART ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${SERVER_URL}/cart/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: newQuantity
        })
      });

      const data = await response.json();

      if (response.ok && data.message) {
        loadCart();
      } else {
        Alert.alert("Алдаа", data.msg || "Тоо шинэчилж чадсангүй");
      }
    } catch (error) {
      console.log("UPDATE CART ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    }
  };

  const checkout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        return;
      }

      const response = await fetch(`${SERVER_URL}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("CHECKOUT RESPONSE:", data);

      if (response.ok && data.order_id) {
        router.push({
          pathname: "/payment",
          params: { orderId: String(data.order_id) }
        });
      } else {
        Alert.alert("Алдаа", data.msg || "Захиалга үүсгэж чадсангүй");
      }
    } catch (error) {
      console.log("CHECKOUT ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    }
  };

  const totalPrice = cartItems.reduce(
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
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        🛒 Cart
      </Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40 }}>
            Сагс хоосон байна
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              elevation: 2
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ marginTop: 6 }}>Үнэ: {item.price}₮</Text>
            <Text>Тоо: {item.quantity}</Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 12,
                gap: 10
              }}
            >
              <View style={{ flex: 1 }}>
                <Button
                  title="-"
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Button
                  title="+"
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Button
                title="❌ Устгах"
                color="#dc2626"
                onPress={() => removeFromCart(item.id)}
              />
            </View>
          </View>
        )}
      />

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          padding: 16,
          marginTop: 10
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
          Нийт дүн: {totalPrice}₮
        </Text>

        <Button title="💳 Захиалах" onPress={checkout} />
      </View>
    </View>
  );
}