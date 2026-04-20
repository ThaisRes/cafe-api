import express from "express";
import type { Application } from "express";
import { pool } from "./db.js";
import { produtoRoutes } from "./routes/produtoRoutes.js";
import { pedidoRoutes } from "./routes/pedidoRoutes.js";
import { exerciciosRoutes } from "./routes/exerciciosRoutes.js";

const app:Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/produtos", produtoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/exercicios", exerciciosRoutes);

/* app.get("/api", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT NOW()");
        res.json({message: "Servidor rodando - DB conectado", dbTime: rows[0]})
    } catch {
        res.status(500).json({error: "Erro ao conectar ao banco"})
    }
}); */

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});