require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API ажиллаж байна 🚀");
});

const db = mysql.createConnection(process.env.MYSQL_PUBLIC_URL);

db.connect((err) => {
  if (err) {
    console.error("DB холболт алдаа:", err);
  } else {
    console.log("DB амжилттай холбогдлоо");
  }
});

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: token шалгах
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ msg: "Token байхгүй" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token буруу" });
  }
};

// Middleware: admin шалгах
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Admin эрх шаардлагатай" });
  }
  next();
};

// ------------------- REGISTER -------------------
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "Username ба password оруулна уу" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      (err) => {
        if (err) {
          return res.status(500).json({ msg: "DB алдаа", err });
        }

        res.json({ msg: "Амжилттай бүртгэгдлээ" });
      }
    );
  } catch (error) {
    res.status(500).json({ msg: "Server алдаа", error });
  }
});

// ------------------- LOGIN -------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "Username ба password оруулна уу" });
  }

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) return res.status(500).json({ msg: "DB алдаа", err });

      if (results.length === 0) {
        return res.status(401).json({ msg: "Хэрэглэгч олдсонгүй" });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ msg: "Нууц үг буруу" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
    }
  );
});

// ------------------- PROFILE -------------------
app.get("/profile", verifyToken, (req, res) => {
  res.json({ msg: "Таны мэдээлэл", user: req.user });
});

// ------------------- TEST REGISTER -------------------
app.get("/test-register", async (req, res) => {
  const username = "admin";
  const password = "1234";

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    (err) => {
      if (err) return res.send(err);
      res.send("REGISTER OK");
    }
  );
});

// ------------------- TEST LOGIN -------------------
app.get("/test-login", (req, res) => {
  const username = "admin";
  const password = "1234";

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err) return res.send(err);

      if (result.length === 0) {
        return res.send("USER NOT FOUND");
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.send("PASSWORD WRONG");
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
    }
  );
});

// ------------------- PRODUCTS -------------------
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      console.log("PRODUCT ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
  });
});

app.post("/products", verifyToken, verifyAdmin, (req, res) => {
  const { name, price, image } = req.body;

  db.query(
    "INSERT INTO products (name, price, image) VALUES (?, ?, ?)",
    [name, price, image || ""],
    (err) => {
      if (err) {
        console.log("ADD PRODUCT ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Product нэмэгдлээ" });
    }
  );
});

app.put("/products/:id", verifyToken, verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, price, image } = req.body;

  db.query(
    "UPDATE products SET name = ?, price = ?, image = ? WHERE id = ?",
    [name, price, image || "", id],
    (err) => {
      if (err) {
        console.log("UPDATE PRODUCT ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Product шинэчлэгдлээ" });
    }
  );
});

app.delete("/products/:id", verifyToken, verifyAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) {
      console.log("DELETE PRODUCT ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: "Product устгалаа" });
  });
});

// ------------------- CART -------------------
app.post("/cart", verifyToken, (req, res) => {
  const user_id = req.user.id;
  const { product_id, quantity } = req.body;

  db.query(
    "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
    [user_id, product_id, quantity || 1],
    (err) => {
      if (err) {
        console.log("CART ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Сагсанд нэмэгдлээ" });
    }
  );
});

app.get("/cart", verifyToken, (req, res) => {
  const user_id = req.user.id;

  db.query(
    `SELECT cart.id, cart.quantity, products.name, products.price
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.user_id = ?`,
    [user_id],
    (err, result) => {
      if (err) {
        console.log("CART LIST ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(result);
    }
  );
});

app.get("/cart/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    `SELECT cart.id, cart.quantity, products.name, products.price
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.user_id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        console.log("CART LIST ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(result);
    }
  );
});

app.put("/cart/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  db.query(
    "UPDATE cart SET quantity = ? WHERE id = ?",
    [quantity, id],
    (err) => {
      if (err) {
        console.log("UPDATE CART ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Тоо ширхэг шинэчлэгдлээ" });
    }
  );
});

app.delete("/cart/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM cart WHERE id = ?", [id], (err) => {
    if (err) {
      console.log("DELETE ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: "Сагснаас устгалаа" });
  });
});

// ------------------- CHECKOUT -------------------
app.post("/checkout", verifyToken, (req, res) => {
  const user_id = req.user.id;

  db.query(
    `SELECT cart.*, products.price
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.user_id = ?`,
    [user_id],
    (err, items) => {
      if (err) {
        console.log("CHECKOUT ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      if (items.length === 0) {
        return res.json({ message: "Сагс хоосон байна" });
      }

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      db.query(
        "INSERT INTO orders (user_id, total) VALUES (?, ?)",
        [user_id, total],
        (err, result) => {
          if (err) {
            console.log("ORDER ERROR:", err);
            return res.status(500).json({ error: err.message });
          }

          const orderId = result.insertId;

          items.forEach((item) => {
            db.query(
              "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
              [orderId, item.product_id, item.quantity]
            );
          });

          db.query(
            "DELETE FROM cart WHERE user_id = ?",
            [user_id],
            (err) => {
              if (err) {
                console.log("CART CLEAR ERROR:", err);
                return res.status(500).json({ error: err.message });
              }

              res.json({
                message: "Захиалга амжилттай",
                total_price: total,
              });
            }
          );
        }
      );
    }
  );
});

// ------------------- ORDERS -------------------
app.get("/orders/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, result) => {
      if (err) {
        console.log("ORDER LIST ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(result);
    }
  );
});

app.get("/order-details/:orderId", (req, res) => {
  const { orderId } = req.params;

  db.query(
    `SELECT order_items.*, products.name, products.price
     FROM order_items
     JOIN products ON order_items.product_id = products.id
     WHERE order_items.order_id = ?`,
    [orderId],
    (err, result) => {
      if (err) {
        console.log("ORDER DETAILS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(result);
    }
  );
});
app.get("/admin/orders", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    "SELECT * FROM orders ORDER BY created_at DESC",
    (err, result) => {
      if (err) {
        console.log("ADMIN ORDERS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(result);
    }
  );
});
app.get("/admin/orders/:id", verifyToken, verifyAdmin, (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT 
      order_items.id,
      order_items.quantity,
      products.name,
      products.price,
      orders.total,
      orders.user_id,
      orders.created_at
     FROM order_items
     JOIN products ON order_items.product_id = products.id
     JOIN orders ON order_items.order_id = orders.id
     WHERE order_items.order_id = ?`,
    [id],
    (err, result) => {
      if (err) {
        console.log("ADMIN ORDER DETAILS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(result);
    }
  );
});
app.put("/admin/orders/:id/status", verifyToken, verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        console.log("UPDATE ORDER STATUS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Order status шинэчлэгдлээ" });
    }
  );
});
// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} порт дээр ажиллаж байна`);
});