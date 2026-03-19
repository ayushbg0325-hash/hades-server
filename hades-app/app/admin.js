import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Admin() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const checkAdmin = async () => {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      alert("Нэвтрээгүй байна");
      router.replace("/");
      return false;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.role !== "admin") {
      alert("Та admin биш байна");
      router.replace("/");
      return false;
    }

    return true;
  };

  const loadProducts = () => {
    fetch("https://hades-server.onrender.com/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.log(err));
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

  const addProduct = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const url = editingId
        ? `http://localhost:3000/products/${editingId}`
        : "http://localhost:3000/products";

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
        alert(editingId ? "Product шинэчлэгдлээ" : "Product нэмэгдлээ");

        setName("");
        setPrice("");
        setImage("");
        setEditingId(null);

        loadProducts();
      } else {
        alert(data.msg || "Алдаа гарлаа");
      }
    } catch (error) {
      console.log(error);
      alert("Сервер холбогдохгүй байна");
    }
  };

  const deleteProduct = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`http://localhost:3000/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.message) {
        alert("Product устгалаа");
        loadProducts();
      } else {
        alert(data.msg || "Устгаж чадсангүй");
      }
    } catch (error) {
      console.log(error);
      alert("Сервер холбогдохгүй байна");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>🛠 Admin Panel</Text>

      <TextInput
        placeholder="Product name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Image URL"
        value={image}
        onChangeText={setImage}
        style={{ borderWidth: 1, marginBottom: 20, padding: 10 }}
      />

      <Button
        title={editingId ? "💾 Хадгалах" : "➕ Product нэмэх"}
        onPress={addProduct}
      />

      <Text style={{ fontSize: 20, marginTop: 30, marginBottom: 10 }}>
        Products
      </Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 15,
              marginBottom: 10,
            }}
          >
            <Text>{item.name}</Text>
            <Text>{item.price}₮</Text>

            <Button
              title="✏️ Засах"
              onPress={() => {
                setEditingId(item.id);
                setName(item.name);
                setPrice(item.price.toString());
                setImage(item.image || "");
              }}
            />

            <Button
              title="❌ Устгах"
              onPress={() => deleteProduct(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}