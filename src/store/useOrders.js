import { create } from "zustand"
import { supabase } from "../supabaseClient"

// 🔹 Mapeia a ordem que vem do banco para o formato usado no React
const mapOrderFromDB = (o) => ({
	...o,
	dataHora: o.data_hora,
	responsavel: o.responsavel || "",
	carroNumero: o.carro_numero,
	modeloCarro: o.carro_modelo || "",
	placaCarro: o.carro_placa || "",
	tipoVeiculo: o.tipo_veiculo || [],
	servicos: o.servicos || [],
	observacoes: o.observacoes || "",
	total: o.total,
	caixinha: o.caixinha,
	vendaProdutosAtiva: o.venda_produtos_ativa,
	nomeProduto: o.nome_produto,
	valorProduto: o.valor_produto,
	quantidadeProduto: o.quantidade_produto,
	formaPagamento: o.forma_pagamento || "",
	descricaoOutros: o.descricao_outros || "",
	status: o.status,
	notaFiscal: o.nota_fiscal || null,
	notaFiscalUrl: o.nota_fiscal_url || null,
	notaFiscalPath: o.nota_fiscal_path || null,
	isDeleted: o.is_deleted || false
})

const useOrders = create((set, get) => ({
	orders: [],
	deletedOrders: [],

	// 🔹 Buscar ordens (ativas + deletadas)
	fetchOrders: async () => {
		const { data, error } = await supabase
			.from("orders_storage")
			.select("*")
			.order("data_hora", { ascending: false })

		if (error) {
			console.error("Erro ao buscar ordens:", error)
		} else {
			const mapped = data.map(mapOrderFromDB)
			set({
				orders: mapped.filter((o) => !o.isDeleted),
				deletedOrders: mapped.filter((o) => o.isDeleted)
			})
		}
	},

	// 🔹 Criar nova ordem (suporte a nota fiscal)
	addOrder: async (order) => {
		const record = {
			data_hora: order.dataHora,
			responsavel: order.responsavel,
			carro_numero: order.carroNumero,
			carro_modelo: order.modeloCarro,
			carro_placa: order.placaCarro,
			tipo_veiculo: order.tipoVeiculo,
			servicos: order.servicos,
			observacoes: order.observacoes,
			total: order.total,
			caixinha: order.caixinha,
			venda_produtos_ativa: order.vendaProdutosAtiva,
			nome_produto: order.nomeProduto,
			valor_produto: order.valorProduto,
			quantidade_produto: order.quantidadeProduto,
			forma_pagamento: order.formaPagamento,
			descricao_outros: order.descricaoOutros,
			status: order.status || "em processamento",
			is_deleted: false,
			nota_fiscal: order.notaFiscal || null,
			nota_fiscal_url: order.notaFiscalUrl || null,
			nota_fiscal_path: order.notaFiscalPath || null
		}

		const { data, error } = await supabase
			.from("orders_storage")
			.insert([record])
			.select()

		if (error) {
			console.error("Erro ao adicionar ordem:", error)
			return null
		} else {
			const mapped = data.map(mapOrderFromDB)
			set((state) => ({ orders: [...state.orders, ...mapped] }))
			return mapped[0]
		}
	},

	// 🔹 Atualizar ordem (com preservação de status e nota fiscal)
	updateOrder: async (updated) => {
		const existingOrder = get().orders.find((o) => o.id === updated.id)

		if (!existingOrder) {
			console.error("Ordem não encontrada para atualização.")
			return null
		}

		// Preserva status
		let finalStatus = existingOrder.status
		if (updated.status && updated.status !== existingOrder.status) {
			finalStatus = updated.status
		}

		const safeUpdate = {
			data_hora: updated.dataHora ?? existingOrder.dataHora,
			responsavel: updated.responsavel ?? existingOrder.responsavel,
			carro_numero: updated.carroNumero ?? existingOrder.carroNumero,
			carro_modelo: updated.modeloCarro ?? existingOrder.modeloCarro,
			carro_placa: updated.placaCarro ?? existingOrder.placaCarro,
			tipo_veiculo: updated.tipoVeiculo ?? existingOrder.tipoVeiculo,
			servicos: updated.servicos ?? existingOrder.servicos,
			observacoes: updated.observacoes ?? existingOrder.observacoes,
			total: updated.total ?? existingOrder.total,
			caixinha: updated.caixinha ?? existingOrder.caixinha,
			venda_produtos_ativa: updated.vendaProdutosAtiva ?? existingOrder.vendaProdutosAtiva,
			nome_produto: updated.nomeProduto ?? existingOrder.nomeProduto,
			valor_produto: updated.valorProduto ?? existingOrder.valorProduto,
			quantidade_produto: updated.quantidadeProduto ?? existingOrder.quantidadeProduto,
			forma_pagamento: updated.formaPagamento ?? existingOrder.formaPagamento,
			descricao_outros:
				updated.descricaoOutros ?? existingOrder.descricaoOutros,
			status: updated.status ?? existingOrder.status,
			nota_fiscal: updated.notaFiscal ?? null,
			nota_fiscal_url: updated.notaFiscalUrl ?? null,
			nota_fiscal_path: updated.notaFiscalPath ?? null,
			is_deleted: updated.isDeleted ?? existingOrder.isDeleted
		}

		const { data, error } = await supabase
			.from("orders_storage")
			.update(safeUpdate)
			.eq("id", updated.id)
			.select()

		if (error) {
			console.error("Erro ao atualizar ordem:", error)
			return null
		} else {
			const mapped = mapOrderFromDB(data[0])
			set((state) => ({
				orders: state.orders.map((order) =>
					order.id === updated.id ? mapped : order
				)
			}))
			return mapped
		}
	},

	// 🔹 Soft Delete
	softDeleteOrder: async (id) => {
		const { data, error } = await supabase
			.from("orders_storage")
			.update({ is_deleted: true })
			.eq("id", id)
			.select()

		if (error) {
			console.error("Erro ao mover ordem para lixeira:", error)
			return
		}

		const mapped = mapOrderFromDB(data[0])
		set((state) => ({
			orders: state.orders.filter((o) => o.id !== id),
			deletedOrders: [...state.deletedOrders, mapped]
		}))
	},

	// 🔹 Restaurar
	restoreOrder: async (id) => {
		const { data, error } = await supabase
			.from("orders_storage")
			.update({ is_deleted: false })
			.eq("id", id)
			.select()

		if (error) {
			console.error("Erro ao restaurar ordem:", error)
			return
		}

		const mapped = mapOrderFromDB(data[0])
		set((state) => ({
			deletedOrders: state.deletedOrders.filter((o) => o.id !== id),
			orders: [...state.orders, mapped]
		}))
	},

	// 🔹 Exclusão permanente
	permanentlyDeleteOrder: async (id) => {
		const { error } = await supabase
			.from("orders_storage")
			.delete()
			.eq("id", id)

		if (error) {
			console.error("Erro ao deletar ordem:", error)
		} else {
			set((state) => ({
				deletedOrders: state.deletedOrders.filter((o) => o.id !== id)
			}))
		}
	}
}))

export default useOrders
