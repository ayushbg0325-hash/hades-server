import { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Image } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native";
export default function Dashboard() {
  const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true); 
  useEffect(() => {
  fetch("https://hades-server.onrender.com/products")
    .then((res) => res.json())
    .then((data) => {
      setProducts(data);
      setLoading(false); // 👈 энд
    })
    .catch((err) => {
      console.log(err);
      setLoading(false); // 👈 алдаа гарсан ч loading зогсоно
    });
}, []);

  const addToCart = async (productId) => {
  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      alert("Нэвтрээгүй байна");
      router.replace("/");
      return;
    }

    const response = await fetch("https://hades-server.onrender.com/cart", {
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
      alert("Сагсанд нэмэгдлээ");
    } else {
      alert(data.msg || "Алдаа гарлаа");
    }
  } catch (error) {
    console.log("CART FETCH ERROR:", error);
    alert("Сервер холбогдохгүй байна");
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
    
  <View style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 16, paddingTop: 40 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        🛍 Products
      </Text>

      <View style={{ marginBottom: 10 }}>
        <Button title="🛒 Cart руу орох" onPress={() => router.push("/cart")} />
      </View>

      <View style={{ marginBottom: 10 }}>
        <Button title="🛠 Admin Panel" onPress={() => router.push("/admin")} />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Button
          title="📦 Захиалгын түүх"
          onPress={() => router.push("/orders")}
        />
      </View>
<View style={{ marginBottom: 20 }}>
  <Button
    title="👤 Profile"
    onPress={() => router.push("/profile")}
  />
</View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              marginBottom: 16,
              overflow: "hidden",
              elevation: 3,
            }}
          >
            
             {item.image ? (
  <Image
    source={{ uri: item.image }}
    style={{
      width: "100%",
      height: 180,
    }}
    resizeMode="cover"
  />
) : (
  <View
    style={{
      width: "100%",
      height: 180,
      backgroundColor: "#ddd",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#666" }}>No Image</Text>
  </View>
)}

            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                {item.name}
              </Text>

              <Text style={{ marginTop: 6, fontSize: 16, color: "#444" }}>
                Үнэ: {item.price}₮
              </Text>

         <View style={{ marginTop: 12 }}>
  <Button
    title="🛒 Сагсанд нэмэх"
    color="#6366f1"
    onPress={() => addToCart(item.id)}
  />
</View>
            </View>
          </View>
        )}
      />
    </View>
  );
}