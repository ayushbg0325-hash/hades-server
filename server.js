require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.get("/", (req, res) => {
  res.send("API ажиллаж байна 🚀");
});

// ------------------- DB CONNECTION -------------------
const db = mysql.createConnection(process.env.MYSQL_PUBLIC_URL);

db.connect((err) => {
  if (err) {
    console.error("DB холболт алдаа:", err);
  } else {
    console.log("DB амжилттай холбогдлоо");
  }
});

// ------------------- JWT SECRET -------------------
const JWT_SECRET = process.env.JWT_SECRET;

// ------------------- MIDDLEWARE -------------------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ msg: "Token байхгүй" });
  }

  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : null;

  if (!token) {
    return res.status(401).json({ msg: "Token буруу байна" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token буруу" });
  }
};

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
          return res.status(500).json({ msg: "DB алдаа", error: err.message });
        }

        return res.json({ msg: "Амжилттай бүртгэгдлээ" });
      }
    );
  } catch (error) {
    return res.status(500).json({ msg: "Server алдаа", error: error.message });
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
      if (err) {
        return res.status(500).json({ msg: "DB алдаа", error: err.message });
      }

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

      return res.json({ token });
    }
  );
});

// ------------------- PROFILE -------------------
app.get("/profile", verifyToken, (req, res) => {
  return res.json({ msg: "Таны мэдээлэл", user: req.user });
});

// ------------------- PRODUCTS -------------------
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      console.log("PRODUCT ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    return res.json(result);
  });
});

app.post("/products", verifyToken, verifyAdmin, (req, res) => {
  const { name, price, image } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ msg: "name болон price шаардлагатай" });
  }

  db.query(
    "INSERT INTO products (name, price, image) VALUES (?, ?, ?)",
    [name, price, image || ""],
    (err) => {
      if (err) {
        console.log("ADD PRODUCT ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json({ message: "Product нэмэгдлээ" });
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

      return res.json({ message: "Product шинэчлэгдлээ" });
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

    return res.json({ message: "Product устгалаа" });
  });
});

// ------------------- CART -------------------
app.post("/cart", verifyToken, (req, res) => {
  const user_id = req.user.id;
  const { product_id, quantity } = req.body;

  if (!product_id) {
    return res.status(400).json({ msg: "product_id шаардлагатай" });
  }

  db.query(
    "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
    [user_id, product_id, quantity || 1],
    (err) => {
      if (err) {
        console.log("CART ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json({ message: "Сагсанд нэмэгдлээ" });
    }
  );
});

app.get("/cart", verifyToken, (req, res) => {
  const user_id = req.user.id;

  db.query(
    `SELECT 
      cart.id, 
      cart.product_id,
      cart.quantity, 
      products.name, 
      products.price,
      products.image
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.user_id = ?`,
    [user_id],
    (err, result) => {
      if (err) {
        console.log("CART LIST ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json(result);
    }
  );
});

app.put("/cart/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || Number(quantity) < 1) {
    return res.status(400).json({ msg: "quantity 1-ээс их байх ёстой" });
  }

  db.query(
    "UPDATE cart SET quantity = ? WHERE id = ?",
    [quantity, id],
    (err) => {
      if (err) {
        console.log("UPDATE CART ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json({ message: "Тоо ширхэг шинэчлэгдлээ" });
    }
  );
});

app.delete("/cart/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM cart WHERE id = ?", [id], (err) => {
    if (err) {
      console.log("DELETE CART ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    return res.json({ message: "Сагснаас устгалаа" });
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

      if (!items || items.length === 0) {
        return res.status(400).json({ msg: "Сагс хоосон байна" });
      }

      const total = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );

      db.query(
        "INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)",
        [user_id, total, "pending"],
        (orderErr, orderResult) => {
          if (orderErr) {
            console.log("ORDER INSERT ERROR:", orderErr);
            return res.status(500).json({ error: orderErr.message });
          }

          const orderId = orderResult.insertId;
          let inserted = 0;
          let hasItemInsertError = false;

          items.forEach((item) => {
            db.query(
              "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
              [orderId, item.product_id, item.quantity],
              (itemErr) => {
                if (hasItemInsertError) return;

                if (itemErr) {
                  hasItemInsertError = true;
                  console.log("ORDER ITEM INSERT ERROR:", itemErr);
                  return res.status(500).json({ error: itemErr.message });
                }

                inserted += 1;

                if (inserted === items.length) {
                  db.query(
                    "DELETE FROM cart WHERE user_id = ?",
                    [user_id],
                    (deleteErr) => {
                      if (deleteErr) {
                        console.log("CART CLEAR ERROR:", deleteErr);
                        return res.status(500).json({ error: deleteErr.message });
                      }

                      return res.json({
                        message: "Захиалга үүсгэлээ. Төлбөрөө үргэлжлүүлнэ үү",
                        order_id: orderId,
                        total_price: total,
                        status: "pending"
                      });
                    }
                  );
                }
              }
            );
          });
        }
      );
    }
  );
});

// ------------------- QPAY -------------------
const getQPayToken = async () => {
  const response = await axios.post(
    `${process.env.QPAY_BASE_URL}/auth/token`,
    {},
    {
      auth: {
        username: process.env.QPAY_CLIENT_ID,
        password: process.env.QPAY_CLIENT_SECRET
      },
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.access_token;
};

app.post("/payments/qpay/create", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ msg: "orderId шаардлагатай" });
    }

    db.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [orderId, req.user.id],
      async (err, results) => {
        if (err) {
          console.log("QPAY ORDER ERROR:", err);
          return res.status(500).json({ msg: "DB алдаа", error: err.message });
        }

        if (!results || results.length === 0) {
          return res.status(404).json({ msg: "Order олдсонгүй" });
        }

        const order = results[0];

        if (order.status === "paid") {
          return res.status(400).json({ msg: "Энэ захиалга аль хэдийн төлөгдсөн байна" });
        }

        const accessToken = await getQPayToken();

        const payload = {
          invoice_code: process.env.QPAY_INVOICE_CODE,
          sender_invoice_no: `ORDER_${order.id}_${Date.now()}`,
          invoice_receiver_code: String(req.user.id),
          invoice_description: `Order #${order.id} payment`,
          amount: Number(order.total),
          callback_url: process.env.QPAY_CALLBACK_URL
        };

        const qpayRes = await axios.post(
          `${process.env.QPAY_BASE_URL}/invoice`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            }
          }
        );

        return res.json({
          invoice_id: qpayRes.data.invoice_id,
          qr_text: qpayRes.data.qr_text || "",
          qr_image: qpayRes.data.qr_image || "",
          urls: Array.isArray(qpayRes.data.urls) ? qpayRes.data.urls : [],
          raw: qpayRes.data
        });
      }
    );
  } catch (error) {
    console.log("QPAY CREATE ERROR:", error?.response?.data || error.message);
    return res.status(500).json({
      msg: "QPay invoice үүсгэж чадсангүй",
      error: error?.response?.data || error.message
    });
  }
});

app.post("/payments/qpay/check", verifyToken, async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ msg: "invoiceId шаардлагатай" });
    }

    const accessToken = await getQPayToken();

    const qpayRes = await axios.post(
      `${process.env.QPAY_BASE_URL}/payment/check`,
      {
        object_type: "INVOICE",
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 100
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json(qpayRes.data);
  } catch (error) {
    console.log("QPAY CHECK ERROR:", error?.response?.data || error.message);
    return res.status(500).json({
      msg: "QPay payment шалгаж чадсангүй",
      error: error?.response?.data || error.message
    });
  }
});

app.put("/payments/order/:orderId/mark-paid", verifyToken, (req, res) => {
  const { orderId } = req.params;

  db.query(
    "UPDATE orders SET status = 'paid' WHERE id = ? AND user_id = ?",
    [orderId, req.user.id],
    (err, result) => {
      if (err) {
        console.log("MARK PAID ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: "Order олдсонгүй" });
      }

      return res.json({ message: "Order төлбөр төлөгдсөн боллоо" });
    }
  );
});

// ------------------- ORDERS -------------------
app.get("/orders", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, result) => {
      if (err) {
        console.log("ORDER LIST ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json(result);
    }
  );
});

app.get("/orders/:userId", verifyToken, (req, res) => {
  const { userId } = req.params;

  db.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, result) => {
      if (err) {
        console.log("ORDER LIST ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json(result);
    }
  );
});

app.get("/order-details/:orderId", verifyToken, (req, res) => {
  const { orderId } = req.params;

  db.query(
    `SELECT 
      order_items.*, 
      products.name, 
      products.price,
      products.image,
      orders.user_id,
      orders.status,
      orders.total,
      orders.created_at
     FROM order_items
     JOIN products ON order_items.product_id = products.id
     JOIN orders ON order_items.order_id = orders.id
     WHERE order_items.order_id = ?`,
    [orderId],
    (err, result) => {
      if (err) {
        console.log("ORDER DETAILS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json(result);
    }
  );
});

// ------------------- ADMIN ORDERS -------------------
app.get("/admin/orders", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    `
    SELECT 
      orders.id,
      orders.user_id,
      users.username,
      orders.total,
      orders.status,
      orders.created_at
    FROM orders
    JOIN users ON orders.user_id = users.id
    ORDER BY orders.created_at DESC
    `,
    (err, result) => {
      if (err) {
        console.log("ADMIN ORDERS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json(result);
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
      orders.created_at,
      orders.status
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

      return res.json(result);
    }
  );
});

app.put("/admin/orders/:id/status", verifyToken, verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, id],
    (err) => {
      if (err) {
        console.log("UPDATE ORDER STATUS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json({ message: "Order status шинэчлэгдлээ" });
    }
  );
});

// ------------------- ADMIN DASHBOARD -------------------
app.get("/admin/stats", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    `
    SELECT
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'paid') AS totalRevenue,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pendingOrders,
      (SELECT COUNT(*) FROM orders WHERE status = 'paid') AS paidOrders
    `,
    (err, result) => {
      if (err) {
        console.log("ADMIN STATS ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json(result[0]);
    }
  );
});

app.get("/admin/revenue-chart", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    `
    SELECT DATE(created_at) AS day, SUM(total) AS revenue
    FROM orders
    WHERE status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
    `,
    (err, result) => {
      if (err) {
        console.log("REVENUE CHART ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      return res.json(result);
    }
  );
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} порт дээр ажиллаж байна`);
});