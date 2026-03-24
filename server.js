// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("./firebaseAdmin"); // <-- ONLY this line

const db = admin.firestore();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

/* =========================
   ROOT API
========================= */
app.get("/", (req, res) => {
  res.send("POS API running");
});

/* =========================
   PRODUCTS APIs
========================= */

// Add product
app.post("/add-product", async (req, res) => {
  try {
    const product = req.body;
    const docRef = await db.collection("products").add(product);

    res.send({
      message: "Product added successfully",
      id: docRef.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to add product" });
  }
});

// Get all products
app.get("/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.send(products);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch products" });
  }
});

// ... (rest of your APIs stay the same)

/* =========================
   SERVER START
========================= */
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
