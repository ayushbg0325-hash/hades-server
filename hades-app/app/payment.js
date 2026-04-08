import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router } from "expo-router";

const SERVER_URL = "https://hades-server.onrender.com";

export default function PaymentScreen() {
  const { orderId, totalPrice } = useLocalSearchParams();

  const [selectedMethod, setSelectedMethod] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const paymentRef = useMemo(() => `ORDER-${orderId}`, [orderId]);

  useEffect(() => {
    if (!orderId) {
      Alert.alert("Алдаа", "Order ID олдсонгүй");
      router.back();
    }
  }, [orderId]);

  useEffect(() => {
    if (selectedMethod === "bank_transfer" && !note) {
      setNote(paymentRef);
    }
  }, [selectedMethod, paymentRef, note]);

  const savePaymentMethod = async () => {
    if (!selectedMethod) {
      Alert.alert("Анхаар", "Төлбөрийн аргаа сонгоно уу");
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        return;
      }

      const response = await fetch(`${SERVER_URL}/orders/${orderId}/payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: selectedMethod,
          payment_note: note
        })
      });

      const data = await response.json();
      console.log("SAVE PAYMENT METHOD RESPONSE:", data);

      if (data.message) {
        Alert.alert(
          "Амжилттай",
          "Төлбөрийн мэдээлэл хадгалагдлаа. Admin шалгаад төлбөрийг баталгаажуулна."
        );
        router.replace("/orders");
      } else {
        Alert.alert("Алдаа", data.msg || "Хадгалж чадсангүй");
      }
    } catch (error) {
      console.log("SAVE PAYMENT METHOD ERROR:", error);
      Alert.alert("Алдаа", "Сервер холбогдохгүй байна");
    } finally {
      setSaving(false);
    }
  };

  const MethodCard = ({ icon, title, subtitle, value, isActive, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor: isActive ? "#111827" : "white",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: isActive ? "#111827" : "#e5e7eb",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: isActive ? "white" : "#111827",
              marginBottom: 6
            }}
          >
            {icon} {title}
          </Text>

          <Text
            style={{
              color: isActive ? "#d1d5db" : "#6b7280",
              lineHeight: 20
            }}
          >
            {subtitle}
          </Text>
        </View>

        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: isActive ? "white" : "#9ca3af",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {isActive ? (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: "white"
              }}
            />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!orderId) {
    return null;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <View style={{ padding: 16, paddingTop: 28 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: "#111827",
            marginBottom: 16
          }}
        >
          💳 Төлбөрийн сонголт
        </Text>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 18,
            padding: 18,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
            Захиалгын мэдээлэл
          </Text>

          <Text style={{ color: "#374151", marginBottom: 6 }}>
            Order ID: {orderId}
          </Text>

          <Text style={{ color: "#374151", marginBottom: 6 }}>
            Нийт дүн: {totalPrice ? `${totalPrice}₮` : "Orders дээрээс шалгана"}
          </Text>

          <View
            style={{
              alignSelf: "flex-start",
              marginTop: 6,
              backgroundColor: "#fef3c7",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999
            }}
          >
            <Text style={{ color: "#92400e", fontWeight: "700" }}>
              Төлбөр хүлээгдэж байна
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 12
          }}
        >
          Төлбөрийн аргаа сонгоно уу
        </Text>

        <MethodCard
          icon="💵"
          title="Cash"
          subtitle="Касс дээр бэлэн мөнгөөр төлнө. Admin мөнгө авсны дараа төлбөрийг баталгаажуулна."
          value="cash"
          isActive={selectedMethod === "cash"}
          onPress={() => setSelectedMethod("cash")}
        />

        <MethodCard
          icon="🏦"
          title="Bank transfer"
          subtitle="Дансаар шилжүүлэг хийнэ. Гүйлгээний утгаа зөв бичээд дараа нь сонголтоо хадгална."
          value="bank_transfer"
          isActive={selectedMethod === "bank_transfer"}
          onPress={() => setSelectedMethod("bank_transfer")}
        />

        {selectedMethod === "cash" && (
          <View
            style={{
              backgroundColor: "#ecfeff",
              borderRadius: 18,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#bae6fd"
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
              💵 Cash төлбөр
            </Text>

            <Text style={{ color: "#0f172a", lineHeight: 22 }}>
              Та касс дээр бэлэн мөнгөөр төлнө. Захиалга "Төлбөр хүлээгдэж байна"
              төлөвтэй үлдэнэ. Admin мөнгө авсны дараа "Төлбөр авсан" болгоно.
            </Text>
          </View>
        )}

        {selectedMethod === "bank_transfer" && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 18,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
              🏦 Дансны мэдээлэл
            </Text>

            <Text style={{ marginBottom: 8, color: "#374151" }}>
              Банк: Khan Bank
            </Text>
            <Text style={{ marginBottom: 8, color: "#374151" }}>
              Данс: 1234567890
            </Text>
            <Text style={{ marginBottom: 8, color: "#374151" }}>
              Нэр: Hades Store
            </Text>
            <Text style={{ marginBottom: 14, color: "#374151", fontWeight: "700" }}>
              Гүйлгээний утга: {paymentRef}
            </Text>

            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 8,
                color: "#111827"
              }}
            >
              Тайлбар / гүйлгээний утга
            </Text>

            <TextInput
              placeholder="Жишээ: ORDER-39 / овог нэр"
              value={note}
              onChangeText={setNote}
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#f9fafb"
              }}
            />
          </View>
        )}

        <TouchableOpacity
          onPress={savePaymentMethod}
          activeOpacity={0.9}
          disabled={saving}
          style={{
            backgroundColor: saving ? "#9ca3af" : "#2563eb",
            borderRadius: 16,
            paddingVertical: 15,
            alignItems: "center",
            marginBottom: 16
          }}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "800"
              }}
            >
              ✅ Сонголтоо хадгалах
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: "#fff7ed",
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: "#fed7aa"
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: "#7c2d12",
              marginBottom: 10
            }}
          >
            Анхааруулга
          </Text>

          <Text style={{ color: "#7c2d12", lineHeight: 22 }}>
            Төлбөрийн аргаа сонгосны дараа захиалга "Төлбөр хүлээгдэж байна"
            төлөвтэй үлдэнэ. Admin мөнгө орсныг эсвэл бэлэн мөнгө авснаа шалгаад
            "Төлбөр авсан" болгоно.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}