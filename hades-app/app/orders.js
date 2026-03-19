import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/orders/1")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
      })
      .catch((err) => console.log(err));
  }, []);

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
        📦 Захиалгын түүх
      </Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/order-details?id=${item.id}`)}
          >
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
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                Order #{item.id}
              </Text>
              <Text style={{ marginTop: 8 }}>Нийт дүн: {item.total}₮</Text>
              <Text>Төлөв: {item.status}</Text>
              <Text style={{ color: "#666", marginTop: 6 }}>
                Огноо: {item.created_at}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}