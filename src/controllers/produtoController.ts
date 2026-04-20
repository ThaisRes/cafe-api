import type { Request, Response} from "express";
import { ProductModel } from "../models/Produto.js";

export const getProdutos = async (req: Request, res: Response) => {
    try {
        const produtos = await ProductModel.listarTodos();
        res.json(produtos);
    } catch {
        res.status(500).json({error: "Erro ao buscar produtos =("})  //500: erro no servidor
    }   
}

export const getProdutoPorId = async (req: Request, res:Response) => {
    const id = Number(req.params.id);
    try {
        const produto = await ProductModel.buscarPorID(id);
        return res.json(produto)
    } catch (error) {
        res.status(500).json({Message: "Erro ao buscar produto", error: error})
    }
}

export const postProdutos = async (req: Request, res:Response) => {
    if(!req.body.nome || !req.body.preco || !req.body.estoque) {
        return res.status(400).json({
            error: " Nome, preco e estoque são obrigatórios"
        })
    }
    try {
        const prod = req.body;
        const novoProduto = await ProductModel.criarProduto(prod)
        return res.status(201).json({
            menssagem: "Produto criado com sucesso.",
            produto: novoProduto
        })
    } catch(error) {
        res.status(500).json({
            error: `Erro ao cadastrar: ${error}`
        })
    }
}

export const deletarProduto = async (req:Request, res:Response) => {
    const id = Number(req.params.id);
    try {
        const deletado = await ProductModel.deletar(id);
        if(!deletado){
            return res.status(404).json({
                error: "Produto não encontrado."
            })
        }
        res.status(204).send(); //.send só envia o status
    } catch (error) {
        res.status(500).json({Message: "Erro ao deletar", error: error})
    } //status 204 = no content
}

export const atualizarProduto = async (req:Request, res:Response) => {
    const id = Number(req.params.id);
    try {
        const produtoAtual = await ProductModel.buscarPorID(id);
        if(!produtoAtual){
            return res.status(404).json({
                error: "Produto não encontrado."
            })
        }
        const dados = {
            nome: req.body.nome ?? produtoAtual.nome,
            preco: req.body.preco ?? produtoAtual.preco,
            estoque: req.body.estoque ?? produtoAtual.estoque
        }
        const atualizado = await ProductModel.atualizar(id, dados);
        return res.json(atualizado)
    } catch (error) {
        res.status(500).json({Message: "Erro ao atualizar", error: error})
    }
}

