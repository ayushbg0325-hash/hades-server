import { View, Text, Button, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 20 }}>
        💳 Төлбөр хийх
      </Text>

      <Text style={{ marginBottom: 10 }}>
        Order ID: {orderId}
      </Text>

      <Text style={{ fontWeight: "700", marginTop: 20 }}>
        🏦 Банкны мэдээлэл:
      </Text>

      <Text>Банк: Хаан банк</Text>
      <Text>Данс: 5808242017</Text>
      <Text>Нэр: Tsend-Ayush Badarch</Text>

      <Text style={{ marginTop: 10 }}>
        💬 Гүйлгээний утга: ORDER_{orderId}
      </Text>

      <Text style={{ marginTop: 20, color: "orange" }}>
        ⚠️ Шилжүүлсний дараа админ батална
      </Text>

      <Button
        title="Буцах"
        onPress={() => router.replace("/orders")}
      />
    </View>
  );
}
const notifyPayment = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    const response = await fetch(`${SERVER_URL}/orders/${orderId}/notify-payment`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert("Амжилттай", data.message);
      router.replace("/orders");
    } else {
      Alert.alert("Алдаа", data.msg || "Мэдэгдэл илгээж чадсангүй");
    }
  } catch (error) {
    console.log("NOTIFY PAYMENT ERROR:", error);
    Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
  }
};
<Button title="✅ Төлбөр хийсэн" onPress={notifyPayment} />