import { pool } from "../db.js";

export interface IItemPedido {  //interface para lidar com objeto
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: number;
  nome: string;
  preco_un: number;
}; //Number maiusculo eu transfomo algo em numero e number com n minusculos é para declarar

export enum StatusEnum {
  PENDENTE = "pendente",
  FINALIZADO = "finalizado"
};

export interface IPedido {
    id: number;
    data_criacao: Date;
    status: string;   //StatusEnum
    itens: IItemPedido[];
};

export interface IPedidoRow {
    pedido_id: number;
    data_criacao: Date;
    status: string;
    item_id: number | null;
    produto_id: number | null;
    quantidade: number | null;
    produto_nome: string | null;
    produto_preco: number | null;
};


export type INovoItemPedido = Pick<IItemPedido, "produto_id" | "quantidade">; //type tem a mesma função do interface mas pode ser escrito em uma linha

export const PedidoModel = {

    //para listar vai ser necessario fazer join das tabelas
    async listarTodos():Promise<IPedido[]>{
        const query = `SELECT 
        p.id as pedido_id, p.data_criacao, p.status, 
        ip.id as item_id, ip.produto_id, ip.quantidade, 
        pr.nome as produto_nome, pr.preco as produto_preco
        FROM pedidos p
        LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
        LEFT JOIN produtos pr ON ip.produto_id = pr.id
        ORDER BY p.data_criacao DESC`;
        const { rows } = await pool.query<IPedidoRow>(query);
        const listaPedidos:IPedido[] = [];
        for( const row of rows ) {
            let pedidoExistente = listaPedidos.find(p => p.id === row.pedido_id);  
            // === serve para comparação
            if(!pedidoExistente) {
                pedidoExistente = {
                    id: row.pedido_id,
                    data_criacao: row.data_criacao,
                    status: row.status,
                    itens: []
                }
                listaPedidos.push(pedidoExistente);
            }
            if(row.item_id){
                pedidoExistente?.itens.push({
                    id: row.item_id,
                    nome: row.produto_nome!,
                    produto_id: row.produto_id!,
                    pedido_id: row.pedido_id!,
                    quantidade: row.quantidade!,
                    preco_un: row.produto_preco!
                });
            }
        }
        return listaPedidos; 
    },

    
    async criar(itens:INovoItemPedido[]): Promise<{id: number}> {
        const client = await pool.connect(); //eu estou fazendo a conexão com o banco e depois devo fechá-la com release()
        try {
            await client.query("BEGIN");
            const pedido = await client.query("INSERT INTO pedidos (status) VALUES ('pendente') RETURNING id");
            const pedidoId = pedido.rows[0].id;
            for(const item of itens) {
                const queryProduto = await client.query("SELECT estoque, nome, preco FROM produtos WHERE id = $1", [item.produto_id]);
                const produtoSelecionado = queryProduto.rows[0];
                if(!produtoSelecionado){
                    throw new Error("Produto não encontrado.");
                };
                if(produtoSelecionado.estoque < item.quantidade){
                    throw new Error(`Estoque insuficiente pra o produto: ${produtoSelecionado.nome}`);
                };
                await client.query("UPDATE produtos SET estoque = estoque - $1 WHERE id = $2", [item.quantidade, item.produto_id]);
                await client.query("INSERT INTO itens_pedido(pedido_id, produto_id, quantidade, preco_un) VALUES ($1, $2, $3, $4)", [pedidoId, item.produto_id, item.quantidade, produtoSelecionado.preco]);
            }

            await client.query("COMMIT");
            return { id: pedidoId };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally{
            client.release();  //desfaz a conexão com o banco
        }
    },

    async deletar(id: number): Promise<boolean> {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const queryItens =
            "SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1";
          const { rows } = await client.query(queryItens, [id]);
          for (const row of rows) {
            await client.query(
              "UPDATE produtos SET estoque = estoque + $1 WHERE id = $2",
              [row.quantidade, row.produto_id]
            );
          }
          const result = await client.query("DELETE FROM pedidos WHERE id = $1", [
            id,
          ]);
          await client.query("COMMIT");
          return (result.rowCount ?? 0) > 0;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      },

    async atualizar(id: number, novosItens: INovoItemPedido[]): Promise<boolean>{
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const{rows:itensAntigos} = await client.query("SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1", [id]);

            if(itensAntigos.length === 0) {
                throw new Error("Pedido não encontrado ou sem itens")
            };

            for(const item of itensAntigos){
                await client.query("UPDATE produtos SET estoque = estoque + $1 WHERE id = $2", [item.quantidade, item.produto.id])
            };

            await client.query("DELETE FROM itens_pedido WHERE pedido_id = $1", [id]);

            for(const item of novosItens){
                const{rows:produto} = await client.query("SELECT estoque, nome, preço FROM produtos WHERE id = $1",[item.produto_id]);          
                const produtoSelecionado = produto[0];
                if (!produtoSelecionado) {
                throw new Error("Produto não encontrado");
                }
                if (produtoSelecionado.estoque < item.quantidade) {
                throw new Error(
                    `Estoque insuficiente para o produto: ${produtoSelecionado.nome}!`
                );
                }
                await client.query(
                "UPDATE produtos SET estoque = estoque - $1 WHERE id = $2",
                [item.quantidade, item.produto_id]
                );
                await client.query(
                "INSERT INTO itens_pedido(pedido_id, produto_id, quantidade, preco_un) VALUES ($1,$2,$3,$4)",
                [id, item.produto_id, item.quantidade, produtoSelecionado.preco]
                );
            }
            await client.query("COMMIT");
            return true;        
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },

    async mudarStatus(id: number, novoStatus: string): Promise<boolean> {
        const query = "UPDATE pedidos SET status = $1 WHERE id = $2";
        const result = await pool.query(query, [novoStatus, id]);
        return (result.rowCount ?? 0) > 0;
    },

    async getFaturamentoTotal(): Promise<{ faturamento_total: number }> {
        const query = `
            SELECT ip.quantidade, ip.preco_un as produto_preco
            FROM itens_pedido ip
            INNER JOIN pedidos p ON p.id = ip.pedido_id
            WHERE p.status = 'finalizado' `;    
        const { rows } = await pool.query<IPedidoRow>(query);    
        const total = rows.reduce((acc, row) => {
            return acc + ((row.quantidade ?? 0) * (row.produto_preco ?? 0));
        }, 0);
    
        return {
            faturamento_total: total
        };
    },

    async cancelarPedido(id: number): Promise<boolean> {
        const client = await pool.connect();
        try{
            await client.query("BEGIN");
            //verificar status
            const{rows} = await client.query<{ status: string }>("SELECT status FROM pedidos WHERE id = $1", [id]);
            const statusPedido = rows[0]?.status;
            if (!statusPedido) {
                throw new Error("Pedido não encontrado");
            }
            if(statusPedido !== 'pendente'){
                throw new Error("Só é possível cancelar pedidos pendentes");
            };
            
            //devolver ao estoque
            const{rows:itensPedido} = await client.query("SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1", [id]);
            for(const item of itensPedido){
                await client.query("UPDATE produtos SET estoque = estoque + $1 WHERE id = $2", [item.quantidade, item.produto_id]);
            }
            
            //mudar status para cancelado
            const queryStatus = "UPDATE pedidos SET status = $1 WHERE id = $2";
            const resultStatus = await client.query(queryStatus, ["Cancelado", id]);
            if (resultStatus.rowCount === 0) {
                throw new Error("Erro ao atualizar status do pedido");
            }
            
            await client.query("COMMIT");
            return true;
        } catch(error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },    
}
