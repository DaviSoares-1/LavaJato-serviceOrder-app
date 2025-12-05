// useGastos.js
import { create } from "zustand"
import { supabase } from "../supabaseClient"

// 🔹 Mapear dados vindos do BD para o formato usado no React
const mapGastoFromDB = (g) => {
	if (!g) return null
	return {
		...g,
		descricaoGasto: g.descricao_gasto ?? "",
		valorGasto: Number(g.valor_gasto) ?? 0,
		createdBy: g.created_by ?? null,
		updatedBy: g.updated_by ?? null,
	}
}

// 🔹 Mapear do React → Banco
const mapGastoToDB = (g) => ({
	descricao_gasto: g.descricaoGasto?.trim() || "",
	valor_gasto: Number(g.valorGasto) || 0
})

const useGastos = create((set, get) => ({
	gastos: [],

	// 🔹 Buscar gastos
	fetchGastos: async () => {
		const { data, error } = await supabase
			.from("gastos_diarios")
			.select("*")
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar gastos:", error)
			return
		}

		set({ gastos: data.map(mapGastoFromDB) })
	},

	// 🔹 Criar gasto
	addGasto: async (gasto) => {
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser()

		if (userError || !user) {
			console.error("Usuário não autenticado:", userError)
			return { error: "Usuário não autenticado" }
		}

		const record = {
			...mapGastoToDB(gasto),
			created_by: user.id
		}

		const { data, error } = await supabase
			.from("gastos_diarios")
			.insert(record)
			.select()
			.single()

		if (error) {
			console.error("Erro ao adicionar gasto:", error)
			return { data: null, error }
		}

		const mapped = mapGastoFromDB(data)

		set((state) => ({
			gastos: [mapped, ...state.gastos]
		}))

		return { data: mapped, error: null }
	},

	// 🔹 Atualizar gasto
	updateGasto: async (gastoAtualizado) => {
		const {
			data: { user }
		} = await supabase.auth.getUser()

		const record = {
			...mapGastoToDB(gastoAtualizado),
			updated_by: user?.id || null
		}

		const { data, error } = await supabase
			.from("gastos_diarios")
			.update(record)
			.eq("id", gastoAtualizado.id)
			.select()
			.single()

		if (error) {
			console.error("Erro ao atualizar gasto:", error)
			return { data: null, error }
		}

		const mapped = mapGastoFromDB(data)

		set((state) => ({
			gastos: state.gastos.map((g) => (g.id === mapped.id ? mapped : g))
		}))

		return { data: mapped, error: null }
	},

	// 🔹 Deletar gasto
	deleteGasto: async (id) => {
		const { error } = await supabase
			.from("gastos_diarios")
			.delete()
			.eq("id", id)

		if (error) {
			console.error("Erro ao remover gasto:", error)
			return error
		}

		set((state) => ({
			gastos: state.gastos.filter((g) => g.id !== id)
		}))

		return null
	}
}))

export default useGastos
