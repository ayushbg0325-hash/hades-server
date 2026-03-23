export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password) {
      alert("Бүх талбарыг бөглөнө үү");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("https://hades-server.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (data.msg) {
        alert(data.msg);
        router.replace("/");
      } else {
        alert("Бүртгэл амжилтгүй");
      }
    } catch (error) {
      console.log(error);
      alert("Сервер холбогдохгүй байна");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
        📝 Бүртгүүлэх
      </Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 20, padding: 10, borderRadius: 8 }}
      />

      <Button
        title={loading ? "Түр хүлээнэ үү..." : "✅ Бүртгүүлэх"}
        onPress={handleRegister}
        disabled={loading}
      />

      <View style={{ marginTop: 10 }}>
        <Button title="🔐 Нэвтрэх" onPress={() => router.push("/")} />
      </View>
    </View>
  );
}