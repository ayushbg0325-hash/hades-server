import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const SERVER_URL = "https://hades-server.onrender.com";

export default function Admin() {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const ok = await checkAdmin();
      if (ok) {
        loadProducts();
      }
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
        Alert.alert("Амжилттай", editingId ? "Product шинэчлэгдлээ" : "Product нэмэгдлээ");
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
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
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

      <FlatList
        data={products}
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
    </View>
  );
}