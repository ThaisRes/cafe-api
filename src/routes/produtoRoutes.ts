import { Router } from "express";
import { getProdutos, getProdutoPorId, postProdutos, atualizarProduto,  deletarProduto } from "../controllers/produtoController.js";

const router = Router();

router.get("/", getProdutos);
router.get("/:id", getProdutoPorId);
router.post("/", postProdutos);
router.patch("/:id", atualizarProduto);
router.delete("/:id", deletarProduto);

export const produtoRoutes = router;