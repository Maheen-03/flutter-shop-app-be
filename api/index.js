require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("../firebaseAdmin"); // adjust if path differs

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
    res.send({ message: "Product added successfully", id: docRef.id });
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

// Get product by barcode
app.get("/products/barcode/:barcode", async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const snapshot = await db
      .collection("products")
      .where("barcode", "==", barcode)
      .get();

    if (snapshot.empty)
      return res.status(404).send({ message: "Product not found" });

    let product;
    snapshot.forEach((doc) => {
      product = { id: doc.id, ...doc.data() };
    });
    res.send(product);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching product");
  }
});

// Get products by category
app.get("/products-by-category/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const snapshot = await db
      .collection("products")
      .where("category_id", "==", categoryId)
      .get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.send(products);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products by category");
  }
});

// Update product
app.put("/update-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedData = req.body;
    await db.collection("products").doc(productId).update(updatedData);
    res.send({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to update product" });
  }
});

// Delete product
app.delete("/delete-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    await db.collection("products").doc(productId).delete();
    res.send({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to delete product" });
  }
});

/* =========================
   CATEGORY APIs
========================= */

// Add category
app.post("/categories/add-category", async (req, res) => {
  try {
    const category = req.body;
    const docRef = await db.collection("categories").add(category);
    res.send({ message: "Category added successfully", id: docRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding category");
  }
});

// Get all categories
app.get("/categories", async (req, res) => {
  try {
    const snapshot = await db.collection("categories").get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.send(categories);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching categories");
  }
});

/* =========================
   INVENTORY API
========================= */

// Stock-in
app.post("/stock-in", async (req, res) => {
  try {
    const { product_id, stock_quantity } = req.body;
    const productRef = db.collection("products").doc(product_id);
    const doc = await productRef.get();
    if (!doc.exists) return res.status(404).send("Product not found");

    const currentStock = doc.data().stock_quantity || 0;
    await productRef.update({ stock_quantity: currentStock + stock_quantity });
    res.send("Stock updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating stock");
  }
});

/* =========================
   SALES APIs
========================= */

// Get sale by ID
app.get("/sales/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await db.collection("sales").doc(id).get();
    if (!doc.exists) return res.status(404).send({ message: "Sale not found" });
    res.send({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching sale");
  }
});

// Create sale
app.post("/create-sale", async (req, res) => {
  try {
    const { items, total_amount, payment_method } = req.body;
    const saleRef = await db
      .collection("sales")
      .add({ items, total_amount, payment_method, created_at: new Date() });

    // Reduce stock
    for (const item of items) {
      const productRef = db.collection("products").doc(item.product_id);
      const productDoc = await productRef.get();
      if (productDoc.exists) {
        const currentStock = productDoc.data().stock_quantity || 0;
        await productRef.update({
          stock_quantity: currentStock - item.quantity,
        });
      }
    }

    res.send({ message: "Sale created successfully", sale_id: saleRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating sale");
  }
});

/* =========================
   Vercel Export
========================= */

module.exports = app;
