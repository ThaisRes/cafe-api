import { pool } from "../db.js";

export interface IProduto {
    id?: number;   //? indica que pode ser undefined
    nome: string;
    preco: number;
    estoque: number;    
};

export const ProductModel = {
    async listarTodos(): Promise<IProduto[]>{   //promessa pq é um async e retorna um array de IProdutos
        const { rows } = await pool.query("SELECT * FROM produtos");
        return rows; // rows é o array de dados que retorna do meu banco
    },     

    async criarProduto(dados:IProduto): Promise<IProduto> {    
        const query = "INSERT INTO produtos(nome, preco, estoque) VALUES ($1, $2, $3) RETURNING *";
        const values = [dados.nome, dados.preco, dados.estoque];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async buscarPorID(id:Number): Promise<IProduto | null> { //Pick pega só o elemnto que quero do produto. Partil pega só o paâmetro e valor que quero. id:Pick<IProduto, "id">
        const query = "SELECT * FROM produtos WHERE id = $1"; 
        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    },

    async atualizar(id:Number, dados:Partial<IProduto>): Promise<IProduto | null> {
        const query = "UPDATE produtos SET nome = $1, preco = $2, estoque = $3 WHERE id = $4 RETURNING *";
        const values = [dados.nome, dados.preco, dados.estoque, id];
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    },

    async deletar(id:Number): Promise<boolean> {
        const result = await pool.query("DELETE FROM produtos WHERE ID = $1", [id]);
        return(result.rowCount ?? 0) > 0; //?? se não tiver result ele vai assumir que é 0. Se return > 0 true, se 0 false.
    }
};