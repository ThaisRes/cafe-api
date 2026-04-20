import type { Request, Response } from "express";
import { PedidoModel, type INovoItemPedido } from "../models/Pedido.js";

export const getPedidos = async (req: Request, res: Response) => {
    try {
        const pedidos = await PedidoModel.listarTodos();
        return res.json(pedidos);
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({error: error.message})
        }
        return res
        .status(500)    
        .json({error: "Ocorreu um erro inesperado ao listar os pedidos."})
    }
};

export const postPedido = async(req: Request, res: Response) => {
    const itens:INovoItemPedido[] = req.body.itens;
    if(!itens || !Array.isArray(itens)){
        return res.status(400).json({error: "Formato de itens inválido."})
    }
    try {
        const novoPedido = await PedidoModel.criar(itens);
        res.status(201).json(novoPedido);
    } catch (error:unknown) {
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message })
        }
        return res.status(500).json({error: "Erro inesperado ao processar o pedido."})
    }
};

export const deletePedido = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
      const sucesso = await PedidoModel.deletar(id);
      if (!sucesso) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      return res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res
        .status(500)
        .json({ error: "Ocorreu um erro inesperado ao deletar o pedido." });
    }
  };
  
export const patchStatus = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: "O novo status deve ser informado" });
    }
    try {
      const sucesso = await PedidoModel.mudarStatus(id, status);
      if (!sucesso) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }
      return res.json({ message: "Status atualizado com sucesso!" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res
        .status(500)
        .json({ error: "Ocorreu um erro inesperado ao atualizar o status." });
    }
};

export const putPedido = async(req: Request, res: Response) => {
    const id = Number(req.params.id);
    const itens: INovoItemPedido[] = req.body.itens;
    if (!itens || !Array.isArray(itens)) {
        res.status(400).json({ error: "Formato de itens inválido" });
    }
    try {
        await PedidoModel.atualizar(id, itens);
        res.json({ message: "Pedido atualizado com sucesso!" });
    } catch (error: unknown) {
        if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
        }
        return res
        .status(500)
        .json({ error: "Ocorreu um erro inesperado ao atualizar o pedido." });
    }
}

export const getFaturamento = async (req: Request, res: Response) =>{
    try {
        const faturamento = await PedidoModel.getFaturamentoTotal();
        return res.json(faturamento);
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({error: error.message})
        }
        return res
        .status(500)    
        .json({error: "Ocorreu um erro inesperado ao gerar o faturamento."})
    }
}

export const cancelarPedido = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
        const sucesso = await PedidoModel.cancelarPedido(id);
            if (!sucesso) {
                return res.status(404).json({ error: "Pedido não encontrado" });
            }
            return res.status(204).send();
    } catch (error) {    
        if(error instanceof Error) {
        return res.status(400).json({error: error.message})
    }
    return res
    .status(500)    
    .json({error: "Ocorreu um erro inesperado ao cancelar o pedido."})
  }
}
