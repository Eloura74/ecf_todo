// app.js
import express from "express";
import dotenv from "dotenv";

// Importations des modules
import path from "path";
import { fileURLToPath } from "url";

// MongoDB
import { MongoClient, ObjectId } from "mongodb";
dotenv.config();
// Initialisation de l'application express
const app = express();
// Port de l'API
const PORT = process.env.PORT || 8080;

// Variables pour la gestion des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les fichiers statiques de l'application REACT build
app.use(express.static("dist"));
// Middleware pour analyser les corps JSON des requêtes
app.use(express.json());

// MongoDB connection a mon container MongoDB-Server de docker
const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/`;
console.log(uri);

const client = new MongoClient(uri);

let tasksCollection;

async function startServer() {
  try {
    await client.connect();
    tasksCollection = client.db(process.env.MONGO_DB).collection("tasks"); // Ajoute .collection("tasks")
    console.log("✅ Connexion MongoDB établie");
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err);
  }
}

startServer(); // N'oublie pas d'appeler la fonction

// Logger middleware pour logger chaque requête
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("↖️  req.body: ");
  console.log(req.body);
  const oldSend = res.send;
  res.send = function (data) {
    console.log("↘️ ", `Status: ${res.statusCode}`);
    if (data) console.log(JSON.parse(data));
    oldSend.call(this, data);
  };
  next();
});

// Opérations CRUD

// GET : Récupérer toutes les tâches
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await tasksCollection.find().toArray(); // Récupérer tous les documents
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Échec de la récupération des tâches." });
  }
});

// POST : Créer une nouvelle tâche
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, completed } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Titre manquant." });
    }

    const result = await tasksCollection.insertOne({ title, completed });
    const createdTask = await tasksCollection.findOne({
      _id: result.insertedId,
    });

    res.status(201).json(createdTask);
  } catch (error) {
    console.error("Erreur création tâche :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la création de la tâche." });
  }
});

// PUT : Mettre à jour une tâche par ID
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    const result = await tasksCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { title, completed } },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ message: "Tâche non trouvée." });
    }

    res.status(200).json(result.value);
  } catch (error) {
    console.error("Erreur mise à jour tâche :", error);
    res
      .status(400)
      .json({ message: "Erreur lors de la mise à jour de la tâche." });
  }
});

// DELETE : Supprimer une tâche par ID
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Tâche introuvable à supprimer." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Erreur suppression tâche :", error);
    res
      .status(400)
      .json({ message: "Erreur lors de la suppression de la tâche." });
  }
});

// Rediriger toutes les autres requêtes vers index.html pour la gestion du routage côté client
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

// Démarrer le serveur et écouter sur le port configuré

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} via http://localhost:${PORT}`);
});
