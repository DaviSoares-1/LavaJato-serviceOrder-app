import { create } from "zustand"
import { supabase } from "../supabaseClient"

// 🔹 Mapeia a ordem que vem do banco para o formato usado no React
const mapOrderFromDB = (o) => {
	if (!o) return null
	return {
		...o,
		dataHora: o.data_hora ?? o.dataHora ?? new Date().toISOString(),
		responsavel: o.responsavel || "",
		carroNumero: o.carro_numero ?? o.carroNumero ?? 0,
		modeloCarro: o.carro_modelo || "",
		placaCarro: o.carro_placa || "",
		tipoVeiculo: o.tipo_veiculo || [],
		servicos: o.servicos || [],
		observacoes: o.observacoes || "",
		total: o.total ?? 0,
		caixinha: o.caixinha ?? 0,
		vendaProdutosAtiva: o.venda_produtos_ativa ?? false,
		nomeProduto: o.nome_produto || "",
		valorProduto: o.valor_produto ?? 0,
		quantidadeProduto: o.quantidade_produto ?? 0,
		formaPagamento: o.forma_pagamento || "",
		descricaoOutros: o.descricao_outros || "",
		status: o.status || "em processamento",
		notaFiscal: o.nota_fiscal || null,
		notaFiscalUrl: o.nota_fiscal_url || null,
		notaFiscalPath: o.nota_fiscal_path || null,
		isDeleted: o.is_deleted ?? false
	}
}

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
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser()

		if (userError || !user) {
			console.error("❌ Usuário não autenticado:", userError)
			alert("Sessão expirada. Faça login novamente para continuar.")
			return null
		}

		const record = {
			created_by: user.id,
			data_hora: order.dataHora ?? new Date().toISOString(),
			responsavel: order.responsavel?.trim() || "",
			carro_numero: Number(order.carroNumero) || 0,
			carro_modelo: order.modeloCarro?.trim() || "",
			carro_placa: order.placaCarro?.trim() || "",
			tipo_veiculo: Array.isArray(order.tipoVeiculo) ? order.tipoVeiculo : [],
			servicos: Array.isArray(order.servicos) ? order.servicos : [],
			observacoes: order.observacoes?.trim() || "",
			total: Number(order.total) || 0,
			caixinha: Number(order.caixinha) || 0,
			venda_produtos_ativa: !!order.vendaProdutosAtiva,
			nome_produto: order.nomeProduto?.trim() || "",
			valor_produto: Number(order.valorProduto) || 0,
			quantidade_produto: Number(order.quantidadeProduto) || 0,
			forma_pagamento: order.formaPagamento || "",
			descricao_outros: order.descricaoOutros?.trim() || "",
			status: order.status || "em processamento",
			nota_fiscal: order.notaFiscal || null,
			nota_fiscal_url: order.notaFiscalUrl || null,
			nota_fiscal_path: order.notaFiscalPath || null,
			is_deleted: false
		}

		console.log("📤 Enviando novo registro:", record)

		const { data, error } = await supabase
			.from("orders_storage")
			.insert([record])
			.select()

		if (error) {
			console.error("Erro ao adicionar ordem:", error)
			return null
		} else {
			console.log("✅ Ordem criada:", data)
			const mapped = data.map(mapOrderFromDB)
			set((state) => ({ orders: [...state.orders, ...mapped] }))
			return mapped[0]
		}
	},

	// 🔹 Atualizar ordem (com preservação de status e nota fiscal)
	updateOrder: async (updated) => {
		const {
			data: { user }
		} = await supabase.auth.getUser()

		console.log("🛠️ Atualizando ordem:", updated)
		if (!updated?.id) {
			console.error("updateOrder: ID não informado", updated)
			return null
		}

		const { data, error } = await supabase
			.from("orders_storage")
			.update({
				data_hora: updated.dataHora ?? new Date().toISOString(),
				responsavel: updated.responsavel ?? "",
				carro_numero: Number(updated.carroNumero) || 0,
				carro_modelo: updated.modeloCarro ?? "",
				carro_placa: updated.placaCarro ?? "",
				tipo_veiculo: Array.isArray(updated.tipoVeiculo)
					? updated.tipoVeiculo
					: [],
				servicos: Array.isArray(updated.servicos) ? updated.servicos : [],
				observacoes: updated.observacoes ?? "",
				total: Number(updated.total) || 0,
				caixinha: Number(updated.caixinha) || 0,
				venda_produtos_ativa: !!updated.vendaProdutosAtiva,
				nome_produto: updated.nomeProduto ?? "",
				valor_produto: Number(updated.valorProduto) || 0,
				quantidade_produto: Number(updated.quantidadeProduto) || 0,
				forma_pagamento: updated.formaPagamento ?? "",
				descricao_outros: updated.descricaoOutros ?? "",
				status: updated.status ?? "em processamento",
				nota_fiscal: updated.notaFiscal ?? null,
				nota_fiscal_url: updated.notaFiscalUrl ?? null,
				nota_fiscal_path: updated.notaFiscalPath ?? null,
				is_deleted: updated.isDeleted ?? false,
				updated_by: user?.id || null
			})
			.eq("id", updated.id)
			.select()

		if (error) {
			console.error("Erro ao atualizar ordem:", error)
			return null
		}

		if (!data?.length) {
			console.warn("updateOrder: Nenhum dado retornado")
			return null
		}

		const mapped = mapOrderFromDB(data[0])
		set((state) => ({
			orders: state.orders.map((o) => (o.id === updated.id ? mapped : o))
		}))
		return mapped
	},

	// 🔹 Soft Delete
	softDeleteOrder: async (id) => {
		console.log("🗑️ softDeleteOrder:", id)

		const { data, error } = await supabase
			.from("orders_storage")
			.update({ is_deleted: true })
			.eq("id", id)
			.select()

		if (error) {
			console.error("❌ Erro ao mover ordem para lixeira:", error.message)
			return
		}

		if (!data?.length) {
			console.warn("⚠️ softDeleteOrder: Nenhum dado retornado. Verifique RLS.")
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
		console.log("♻️ restoreOrder:", id)

		const { data, error } = await supabase
			.from("orders_storage")
			.update({ is_deleted: false })
			.eq("id", id)
			.select()

		if (error) {
			console.error("❌ Erro ao restaurar ordem:", error.message)
			return
		}

		if (!data?.length) {
			console.warn("⚠️ restoreOrder: Nenhum dado retornado. Verifique RLS.")
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
		console.log("🔥 permanentlyDeleteOrder:", id)

		const { data, error } = await supabase
			.from("orders_storage")
			.delete()
			.eq("id", id)
			.select() // <-- IMPORTANTE

		if (error) {
			console.error("❌ Erro ao deletar ordem permanentemente:", error.message)
			return
		}

		if (!data || data.length === 0) {
			console.warn(
				"⚠️ Nenhum registro deletado. RLS provavelmente bloqueou o DELETE."
			)
			return
		}

		set((state) => ({
			deletedOrders: state.deletedOrders.filter((o) => o.id !== id)
		}))
	}
}))

export default useOrders
