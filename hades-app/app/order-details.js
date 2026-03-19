import { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3000/order-details/${id}`)
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>
        🧾 Order #{id}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }: any) => (
          <View
            style={{
              borderWidth: 1,
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
            }}
          >
            <Text>{item.name}</Text>
            <Text>Тоо: {item.quantity}</Text>
            <Text>Үнэ: {item.price}₮</Text>
          </View>
        )}
      />
    </View>
  );
}