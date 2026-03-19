import { useEffect, useState } from "react";
import { View, Text, FlatList, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);

  const loadCart = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch("https://hades-server.onrender.com/cart", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      setCartItems(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeFromCart = async (id) => {
    try {
      const response = await fetch(`https://hades-server.onrender.com/cart/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (data.message) {
        alert("Устгалаа");
        loadCart();
      } else {
        alert("Устгаж чадсангүй");
      }
    } catch (error) {
      console.log(error);
      alert("Сервер холбогдохгүй байна");
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    try {
      const response = await fetch(`https://hades-server.onrender.com/cart/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          quantity: newQuantity
        })
      });

      const data = await response.json();

      if (data.message) {
        loadCart();
      } else {
        alert("Тоо шинэчилж чадсангүй");
      }
    } catch (error) {
      console.log(error);
      alert("Сервер холбогдохгүй байна");
    }
  };

  const checkout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch("https://hades-server.onrender.com/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("CHECKOUT RESPONSE:", data);

      if (data.total_price !== undefined) {
        alert(`Захиалга амжилттай\nНийт: ${data.total_price}₮`);
        loadCart();
      } else {
        alert(data.message || "Алдаа гарлаа");
      }
    } catch (error) {
      console.log(error);
      alert("Сервер холбогдохгүй байна");
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 16 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        🛒 Cart
      </Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ marginTop: 8 }}>Үнэ: {item.price}₮</Text>
            <Text style={{ marginBottom: 12 }}>Тоо: {item.quantity}</Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12
              }}
            >
              <Button
                title="-"
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              />
              <Button
                title="+"
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              />
            </View>

            <Button
              title="❌ Устгах"
              onPress={() => removeFromCart(item.id)}
            />
          </View>
        )}
      />

      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginTop: 10,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Нийт дүн: {totalPrice}₮
      </Text>

      <Button title="💳 Захиалах" onPress={checkout} />
    </View>
  );
}