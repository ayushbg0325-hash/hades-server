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

import { API_URL as SERVER_URL } from "../constants/api";

export default function PaymentScreen() {
  const { orderId, totalPrice } = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const paymentRef = useMemo(() => `ORDER-${orderId}`, [orderId]);

  useEffect(() => {
    if (!orderId) {
      Alert.alert("Error", "Order ID not found");
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
      Alert.alert("Warning", "Choose a payment method first");
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You are not logged in");
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
      if (data.message) {
        Alert.alert("Success", "Payment information saved");
        router.replace("/orders");
        return;
      }

      Alert.alert("Error", data.msg || "Could not save payment details");
    } catch (error) {
      console.log("SAVE PAYMENT METHOD ERROR:", error);
      Alert.alert("Error", "Could not connect to the server");
    } finally {
      setSaving(false);
    }
  };

  const MethodCard = ({ icon, title, subtitle, isActive, onPress }) => (
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
          Payment Method
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
            Order Summary
          </Text>
          <Text style={{ color: "#374151", marginBottom: 6 }}>Order ID: {orderId}</Text>
          <Text style={{ color: "#374151", marginBottom: 6 }}>
            Total: {totalPrice ? `${totalPrice}₮` : "Check the order list for the total"}
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
            <Text style={{ color: "#92400e", fontWeight: "700" }}>Awaiting payment review</Text>
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
          Select payment method
        </Text>

        <MethodCard
          icon="💵"
          title="Cash"
          subtitle="Pay in cash when the order is handed over."
          isActive={selectedMethod === "cash"}
          onPress={() => setSelectedMethod("cash")}
        />

        <MethodCard
          icon="🏦"
          title="Bank transfer"
          subtitle="Transfer to the account below and keep the transfer reference."
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
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>Cash payment</Text>
            <Text style={{ color: "#0f172a", lineHeight: 22 }}>
              Your order will remain in pending status until an admin confirms payment was received.
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
              Bank details
            </Text>
            <Text style={{ marginBottom: 8, color: "#374151" }}>Bank: Khan Bank</Text>
            <Text style={{ marginBottom: 8, color: "#374151" }}>Account: 1234567890</Text>
            <Text style={{ marginBottom: 8, color: "#374151" }}>Name: Hades Store</Text>
            <Text style={{ marginBottom: 14, color: "#374151", fontWeight: "700" }}>
              Reference: {paymentRef}
            </Text>

            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 8,
                color: "#111827"
              }}
            >
              Transfer note
            </Text>

            <TextInput
              placeholder="Example: ORDER-39 / your name"
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
              Save selection
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
            Important
          </Text>
          <Text style={{ color: "#7c2d12", lineHeight: 22 }}>
            After you choose a payment method, the order stays pending until an admin verifies it.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
