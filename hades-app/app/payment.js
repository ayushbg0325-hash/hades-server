import { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  ScrollView,
  Image,
  Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router } from "expo-router";

const SERVER_URL = "https://hades-server.onrender.com";

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams();

  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const createQPayInvoice = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Алдаа", "Нэвтрээгүй байна");
        setLoading(false);
        return;
      }

      const response = await fetch(`${SERVER_URL}/payments/qpay/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: Number(orderId)
        })
      });

      const data = await response.json();
      console.log("QPAY CREATE:", data);

      if (!response.ok) {
        Alert.alert("Алдаа", data.msg || "QPay invoice үүсгэж чадсангүй");
        setInvoiceData(null);
        return;
      }

      setInvoiceData(data);
    } catch (error) {
      console.log("QPAY CREATE ERROR:", error);
      Alert.alert("Алдаа", "QPay invoice үүсгэж чадсангүй");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      createQPayInvoice();
    } else {
      setLoading(false);
      Alert.alert("Алдаа", "orderId олдсонгүй");
    }
  }, [orderId]);

  const checkPayment = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!invoiceData?.invoice_id) {
        Alert.alert("Алдаа", "invoice_id олдсонгүй");
        return;
      }

      const response = await fetch(`${SERVER_URL}/payments/qpay/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceId: invoiceData.invoice_id
        })
      });

      const data = await response.json();
      console.log("QPAY CHECK:", data);

      if (!response.ok) {
        Alert.alert("Алдаа", data.msg || "Төлбөр шалгаж чадсангүй");
        return;
      }

      const rows = data?.rows || data?.payments || [];
      const hasPaid =
        Array.isArray(rows) &&
        rows.some((row) => row.payment_status === "PAID");

      if (hasPaid) {
        const markPaidRes = await fetch(
          `${SERVER_URL}/payments/order/${orderId}/mark-paid`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const markPaidData = await markPaidRes.json();
        console.log("MARK PAID:", markPaidData);

        if (!markPaidRes.ok) {
          Alert.alert("Алдаа", markPaidData.msg || "Order paid болгож чадсангүй");
          return;
        }

        Alert.alert("Амжилттай", "Төлбөр баталгаажлаа");
        router.replace("/orders");
      } else {
        Alert.alert("Мэдээлэл", "Төлбөр хараахан орж ирээгүй байна");
      }
    } catch (error) {
      console.log("QPAY CHECK ERROR:", error);
      Alert.alert("Алдаа", "Төлбөр шалгаж чадсангүй");
    }
  };

  const openLink = async (url) => {
    try {
      if (!url) return;
      await Linking.openURL(url);
    } catch (error) {
      console.log("OPEN LINK ERROR:", error);
      Alert.alert("Алдаа", "Link нээж чадсангүй");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>QPay invoice үүсгэж байна...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#f3f4f6" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
        💳 QPay төлбөр
      </Text>

      {invoiceData ? (
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16
          }}
        >
          <Text style={{ marginBottom: 8 }}>Order ID: {orderId}</Text>
          <Text style={{ marginBottom: 8 }}>
            Invoice ID: {invoiceData.invoice_id}
          </Text>

          <Text style={{ marginBottom: 8, fontWeight: "700" }}>
            Доорх QR-ээр төлбөрөө төлнө
          </Text>

          {invoiceData.qr_image ? (
            <Image
              source={{ uri: `data:image/png;base64,${invoiceData.qr_image}` }}
              style={{
                width: 260,
                height: 260,
                alignSelf: "center",
                marginVertical: 16
              }}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: "red", marginBottom: 12 }}>
              QR зураг ирсэнгүй
            </Text>
          )}

          {!!invoiceData.qr_text && (
            <>
              <Text style={{ fontWeight: "700", marginBottom: 8 }}>
                QR Text
              </Text>
              <Text selectable style={{ color: "#2563eb", marginBottom: 12 }}>
                {invoiceData.qr_text}
              </Text>
            </>
          )}

          {Array.isArray(invoiceData.urls) && invoiceData.urls.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "700", marginBottom: 8 }}>
                QPay App холбоосууд
              </Text>

              {invoiceData.urls.map((item, index) => (
                <View key={index} style={{ marginBottom: 10 }}>
                  <Button
                    title={item.name || `Link ${index + 1}`}
                    onPress={() => openLink(item.link)}
                  />
                </View>
              ))}
            </View>
          )}

          <Button title="🔄 Төлбөр шалгах" onPress={checkPayment} />
        </View>
      ) : (
        <Text>Invoice мэдээлэл олдсонгүй</Text>
      )}
    </ScrollView>
  );
}