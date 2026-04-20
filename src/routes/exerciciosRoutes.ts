import { Router } from "express";
import { cancelarPedido, getFaturamento } from "../controllers/pedidosController.js";

const router = Router();

router.get("/relatorio", getFaturamento);
router.patch("/:id/cancelar", cancelarPedido)

export const exerciciosRoutes = router;