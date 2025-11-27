import { create } from "zustand"
import { supabase } from "../supabaseClient"

// 🔹 Mapeia cliente do banco → formato usado no React
const mapClienteFromDB = (c) => {
	if (!c) return null

	return {
		...c,
		nomeCliente: c.nome_cliente || "",
		contatoCliente: c.contato_cliente || "",
		qntdServicos: Number(c.qntd_servicos) || 0,
		modeloVeiculo: c.modelo_veiculo || "",
		placaVeiculo: c.placa_veiculo || "",
		dataServico: c.data_servico || null,
		valorPromocionalAtivo: c.valor_promocional_ativo ?? false,
		createdBy: c.created_by || null,
		updatedBy: c.updated_by || null
	}
}

const useClientes = create((set, get) => ({
	clientes: [],

	// 🔹 Buscar todos os clientes
	fetchClientes: async () => {
		const { data, error } = await supabase
			.from("clientes")
			.select("*")
			.order("nome_cliente", { ascending: true })

		if (error) {
			console.error("❌ Erro ao buscar clientes:", error)
			return
		}

		set({ clientes: data.map(mapClienteFromDB) })
	},

	// 🔹 Criar cliente novo
	addCliente: async (cliente) => {
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!user) {
			alert("Sessão expirada. Faça login novamente.")
			return null
		}

		const record = {
			created_by: user.id,
			updated_by: user.id,
			nome_cliente: cliente.nomeCliente.trim(),
			contato_cliente: cliente.contatoCliente.trim(),
			qntd_servicos: Number(cliente.qntdServicos) || 0,
			modelo_veiculo: cliente.modeloVeiculo.trim(),
			placa_veiculo: cliente.placaVeiculo.trim(),
			data_servico: cliente.dataServico || new Date().toISOString(),
			valor_promocional_ativo:
				Number(cliente.qntdServicos) > 0 &&
				Number(cliente.qntdServicos) % 8 === 0
		}

		const { data, error } = await supabase
			.from("clientes")
			.insert([record])
			.select()

		if (error) {
			console.error("❌ Erro ao adicionar cliente:", error)
			return null
		}

		const novo = mapClienteFromDB(data[0])
		set((state) => ({ clientes: [...state.clientes, novo] }))
		return novo
	},

	// 🔹 Atualizar cliente existente
	updateCliente: async (updated) => {
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!updated?.id) {
			console.error("updateCliente: ID não informado")
			return null
		}

		const record = {
			nome_cliente: updated.nomeCliente.trim(),
			contato_cliente: updated.contatoCliente.trim(),
			qntd_servicos: Number(updated.qntdServicos) || 0,
			modelo_veiculo: updated.modeloVeiculo.trim(),
			placa_veiculo: updated.placaVeiculo.trim(),
			data_servico: updated.dataServico,
			valor_promocional_ativo:
				Number(updated.qntdServicos) > 0 &&
				Number(updated.qntdServicos) % 8 === 0,
			updated_by: user.id
		}

		const { data, error } = await supabase
			.from("clientes")
			.update(record)
			.eq("id", updated.id)
			.select()

		if (error) {
			console.error("❌ Erro ao atualizar cliente:", error)
			return null
		}

		const cli = mapClienteFromDB(data[0])

		set((state) => ({
			clientes: state.clientes.map((c) => (c.id === cli.id ? cli : c))
		}))

		return cli
	},

	// 🔹 Exclusão (apenas admins na sua policy)
	deleteCliente: async (id) => {
		const { data, error } = await supabase
			.from("clientes")
			.delete()
			.eq("id", id)
			.select()

		if (error) {
			console.error("❌ Erro ao excluir cliente:", error)
			return
		}

		set((state) => ({
			clientes: state.clientes.filter((c) => c.id !== id)
		}))
	}
}))

export default useClientes
