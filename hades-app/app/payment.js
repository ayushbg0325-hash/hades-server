import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router } from "expo-router";

import { API_URL as SERVER_URL } from "../constants/api";
import { card, colors, content, formatCurrency, screen } from "../constants/ui";

export default function PaymentScreen() {
  const { orderId, totalPrice } = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const paymentRef = useMemo(() => `ORDER-${orderId}`, [orderId]);

  useEffect(() => {
    if (!orderId) {
      Alert.alert("Алдаа", "Захиалгын дугаар олдсонгүй.");
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
      Alert.alert("Анхаар", "Төлбөрийн хэлбэрээ сонгоно уу.");
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Нэвтрэлт шаардлагатай", "Эхлээд систем рүү нэвтэрнэ үү.");
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

      if (response.ok && data.message) {
        router.replace("/orders");
        return;
      }

      Alert.alert("Алдаа", data.msg || "Төлбөрийн мэдээлэл хадгалсангүй.");
    } catch (error) {
      console.log("SAVE PAYMENT METHOD ERROR:", error);
      Alert.alert("Алдаа", "Сервертэй холбогдсонгүй.");
    } finally {
      setSaving(false);
    }
  };

  const renderMethodCard = (key, title, subtitle, palette) => {
    const active = selectedMethod === key;
    return (
      <TouchableOpacity
        key={key}
        onPress={() => setSelectedMethod(key)}
        activeOpacity={0.9}
        style={[
          card,
          {
            marginBottom: 14,
            backgroundColor: active ? palette.activeBg : colors.surfaceStrong,
            borderColor: active ? palette.activeBorder : colors.border
          }
        ]}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: active ? palette.activeText : colors.text,
            marginBottom: 6
          }}
        >
          {title}
        </Text>
        <Text style={{ color: active ? palette.activeSubtle : colors.textMuted, lineHeight: 21 }}>{subtitle}</Text>
      </TouchableOpacity>
    );
  };

  if (!orderId) {
    return null;
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
          <Text style={{ color: "#a5f3fc", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>PAYMENT</Text>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginBottom: 8 }}>
            Төлбөрийн мэдээлэл
          </Text>
          <Text style={{ color: "#cffafe", lineHeight: 22 }}>
            Захиалга баталгаажуулахын тулд төлбөрийн хэлбэрээ сонгоод хадгална уу.
          </Text>
        </View>

        <View style={[card, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 10 }}>
            Захиалгын хураангуй
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Захиалга: #{orderId}</Text>
          <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 22 }}>
            Нийт дүн: {formatCurrency(totalPrice)}
          </Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: 12 }}>
          Төлбөрийн хэлбэр сонгох
        </Text>

        {renderMethodCard("cash", "Бэлэн мөнгө", "Хүлээлгэн өгөх үед бэлнээр төлнө.", {
          activeBg: "#172033",
          activeBorder: "#172033",
          activeText: "#ffffff",
          activeSubtle: "#cbd5e1"
        })}

        {renderMethodCard("bank_transfer", "Дансаар шилжүүлэх", "Доорх данс руу шилжүүлээд гүйлгээний утгаа хадгална.", {
          activeBg: "#9a3412",
          activeBorder: "#9a3412",
          activeText: "#ffffff",
          activeSubtle: "#fed7aa"
        })}

        {selectedMethod === "cash" ? (
          <View style={[card, { marginBottom: 16, backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1d4ed8", marginBottom: 8 }}>
              Бэлэн төлбөрийн тайлбар
            </Text>
            <Text style={{ color: "#1e3a8a", lineHeight: 22 }}>
              Админ төлбөрийг баталгаажуулах хүртэл захиалга хүлээгдэж буй төлөвт байна.
            </Text>
          </View>
        ) : null}

        {selectedMethod === "bank_transfer" ? (
          <View style={[card, { marginBottom: 16 }]}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 10 }}>
              Шилжүүлгийн мэдээлэл
            </Text>
            <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Банк: Khan Bank</Text>
            <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Данс: 1234567890</Text>
            <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Хүлээн авагч: Hades Store</Text>
            <Text style={{ color: colors.primaryDark, fontWeight: "900", marginBottom: 12 }}>
              Гүйлгээний утга: {paymentRef}
            </Text>
            <TextInput
              placeholder="Жишээ: ORDER-39 / таны нэр"
              placeholderTextColor={colors.textSoft}
              value={note}
              onChangeText={setNote}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: "#fffdf9"
              }}
            />
          </View>
        ) : null}

        <TouchableOpacity
          onPress={savePaymentMethod}
          disabled={saving}
          activeOpacity={0.9}
          style={{
            backgroundColor: saving ? colors.textSoft : colors.primary,
            borderRadius: 18,
            paddingVertical: 15,
            alignItems: "center",
            marginBottom: 16
          }}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>Төлбөрийн мэдээлэл хадгалах</Text>
          )}
        </TouchableOpacity>

        <View style={[card, { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }]}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.warning, marginBottom: 8 }}>
            Санамж
          </Text>
          <Text style={{ color: colors.warning, lineHeight: 22 }}>
            Сонголтоо хадгалсны дараа админ баталгаажуулж байж захиалга дараагийн төлөв рүү шилжинэ.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
