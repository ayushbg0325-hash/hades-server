import { useState } from "react";
import { View, Text, Button, Alert, ScrollView, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router } from "expo-router";

const SERVER_URL = "https://hades-server.onrender.com";

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const savePaymentMethod = async (method) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${SERVER_URL}/orders/${orderId}/payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: method,
          payment_note: note
        })
      });

      const data = await response.json();

      if (data.message) {
        Alert.alert("Амжилттай", "Төлбөрийн мэдээлэл хадгалагдлаа");
        router.replace("/orders");
      } else {
        Alert.alert("Алдаа", data.msg || "Хадгалж чадсангүй");
      }
    } catch (error) {
      console.log("SAVE PAYMENT METHOD ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#f3f4f6" }}>
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 16 }}>
        💳 Төлбөрийн сонголт
      </Text>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Order ID: {orderId}
        </Text>

        <Text style={{ marginBottom: 12 }}>
          Төлбөрийн аргаа сонгоно уу
        </Text>

        <View style={{ marginBottom: 12 }}>
          <Button
            title={loading ? "Түр хүлээнэ үү..." : "💵 Cash төлөх"}
            onPress={() => savePaymentMethod("cash")}
            disabled={loading}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Button
            title={loading ? "Түр хүлээнэ үү..." : "🏦 Bank transfer"}
            onPress={() => savePaymentMethod("bank_transfer")}
            disabled={loading}
          />
        </View>
      </View>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
          🏦 Дансны мэдээлэл
        </Text>

        <Text style={{ marginBottom: 6 }}>Банк: Khan Bank</Text>
        <Text style={{ marginBottom: 6 }}>Данс: 1234567890</Text>
        <Text style={{ marginBottom: 6 }}>Нэр: Hades Store</Text>
        <Text style={{ marginBottom: 12 }}>
          Гүйлгээний утга: ORDER-{orderId}
        </Text>

        <Text style={{ marginBottom: 8, fontWeight: "600" }}>
          Тайлбар / гүйлгээний утга
        </Text>

        <TextInput
          placeholder="Жишээ: ORDER-25 / овог нэр"
          value={note}
          onChangeText={setNote}
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 10,
            padding: 12
          }}
        />
      </View>

      <View
        style={{
          backgroundColor: "#fff7ed",
          borderRadius: 14,
          padding: 16
        }}
      >
        <Text style={{ fontWeight: "700", marginBottom: 8 }}>
          Анхааруулга
        </Text>
        <Text style={{ color: "#7c2d12" }}>
          Төлбөр сонгосны дараа захиалга "Төлбөр хүлээгдэж байна" төлөвтэй үлдэнэ.
          Admin мөнгө орсныг шалгаад "Төлбөр авсан" болгоно.
        </Text>
      </View>
    </ScrollView>
  );
}