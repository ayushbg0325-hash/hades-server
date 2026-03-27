import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen name="dashboard" options={{ title: "Products" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="admin" options={{ href: null }} />
      <Tabs.Screen name="screens/HomeScreen" options={{   href: null}}/>
      <Tabs.Screen name="register" options={{ href: null }} />
      <Tabs.Screen name="modal" options={{ href: null }} />
<Tabs.Screen name="(tabs)" options={{ href: null }} />
    </Tabs>
  );
}