import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL as SERVER_URL } from "../constants/api";
import { card, colors, content, formatCurrency, screen } from "../constants/ui";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Нэвтрэлт шаардлагатай", "Сагсаа харахын тулд эхлээд нэвтэрнэ үү.");
        router.replace("/");
        return;
      }

      const response = await fetch(`${SERVER_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        setCartItems(Array.isArray(data) ? data : []);
        return;
      }

      Alert.alert("Алдаа", data.msg || "Сагсны мэдээлэл ачаалсангүй.");
    } catch (error) {
      console.log("LOAD CART ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  const removeFromCart = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${SERVER_URL}/cart/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.message) {
        loadCart();
        return;
      }

      Alert.alert("Алдаа", data.msg || "Сагснаас устгаж чадсангүй.");
    } catch (error) {
      console.log("REMOVE CART ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
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
        body: JSON.stringify({ quantity: newQuantity })
      });
      const data = await response.json();

      if (response.ok && data.message) {
        loadCart();
        return;
      }

      Alert.alert("Алдаа", data.msg || "Тоо хэмжээг шинэчилж чадсангүй.");
    } catch (error) {
      console.log("UPDATE CART ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
    }
  };

  const checkout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Нэвтрэлт шаардлагатай", "Эхлээд нэвтэрнэ үү.");
        return;
      }

      const response = await fetch(`${SERVER_URL}/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.order_id) {
        router.push({
          pathname: "/payment",
          params: {
            orderId: String(data.order_id),
            totalPrice: String(data.total_price)
          }
        });
        return;
      }

      Alert.alert("Алдаа", data.msg || "Захиалга үүсгэж чадсангүй.");
    } catch (error) {
      console.log("CHECKOUT ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  if (loading) {
    return (
      <View style={[screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Сагс ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={screen}>
      <View style={content}>
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 30,
            padding: 22,
            marginBottom: 16
          }}
        >
          <Text style={{ color: "#a5f3fc", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>MY CART</Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 8 }}>Таны сагс</Text>
          <Text style={{ color: "#cffafe", lineHeight: 22 }}>
            Сонгосон бараагаа шалгаад, төлбөрийн хэлбэрээ үргэлжлүүлэн сонгоорой.
          </Text>
        </View>

        {cartItems.length === 0 ? (
          <View style={card}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
              Сагс хоосон байна
            </Text>
            <Text style={{ color: colors.textMuted, marginBottom: 16 }}>
              Dashboard руу буцаад бараа сонгож нэмнэ үү.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/dashboard")}
              activeOpacity={0.9}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white", fontWeight: "800" }}>Бараа үзэх</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <View key={item.id} style={[card, { marginBottom: 14 }]}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 4 }}>
                  Нэгж үнэ: {formatCurrency(item.price)}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Тоо хэмжээ: {item.quantity}</Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ fontWeight: "800", color: colors.text }}>- 1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                    style={{
                      flex: 1,
                      backgroundColor: "#ecfccb",
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ fontWeight: "800", color: colors.success }}>+ 1</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => removeFromCart(item.id)}
                  style={{
                    marginTop: 12,
                    backgroundColor: "#fee2e2",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ fontWeight: "800", color: colors.danger }}>Сагснаас хасах</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={card}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: 8 }}>
                Нийт төлбөр
              </Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: colors.primaryDark, marginBottom: 16 }}>
                {formatCurrency(totalPrice)}
              </Text>
              <TouchableOpacity
                onPress={checkout}
                activeOpacity={0.9}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 15,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Төлбөрийн хэсэг рүү шилжих</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
