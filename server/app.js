// app.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.static("dist"));
app.use(express.json());

// Connexion MongoDB
const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/`;
const client = new MongoClient(uri);
let tasksCollection;

async function startServer() {
  try {
    await client.connect();
    tasksCollection = client.db(process.env.MONGO_DB).collection("tasks");
    console.log("✅ Connexion MongoDB établie");
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err);
  }
}

startServer();

// Logger simple
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("↖️  req.body:", req.body);
  next();
});

// === ROUTES ===

// GET toutes les tâches
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await tasksCollection.find().toArray();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération des tâches." });
  }
});

// POST créer une tâche
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, completed } = req.body;
    const result = await tasksCollection.insertOne({
      title,
      completed,
    });

    const createdTask = await tasksCollection.findOne({
      _id: result.insertedId,
    });

    res.status(201).json(createdTask);
  } catch (error) {
    console.error("Erreur création tâche:", error);
    res.status(500).json({ message: "Erreur lors de la création." });
  }
});

// PUT mettre à jour une tâche (barrer / débarrer)
app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const updates = req.body;

    const result = await tasksCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" } // <= renvoie la version mise à jour
    );

    if (!result.value) {
      return res.status(404).json({ message: "Tâche non trouvée." });
    }

    res.status(200).json(result.value);
  } catch (error) {
    console.error("Erreur mise à jour tâche :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour." });
  }
});

// DELETE une tâche
app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const result = await tasksCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Tâche introuvable." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Erreur suppression tâche :", error);
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
