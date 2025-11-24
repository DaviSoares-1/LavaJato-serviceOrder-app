import { create } from "zustand"
import { supabase } from "../supabaseClient"

// Mapeia dados vindos do Supabase para o formato usado no front
const mapGastoFromDB = (g) => ({
	...g,
	descricaoGasto: g.descricao_gasto || "",
	valorGasto: parseFloat(g.valor_gasto) || 0
})

const useGastos = create((set, get) => ({
	gastos: [],

	// 🔹 Buscar todos os gastos no Supabase
	fetchGastos: async () => {
		const { data, error } = await supabase
			.from("gastos_diarios")
			.select("*")
			.order("id", { ascending: true })

		if (error) {
			console.error("Erro ao buscar gastos:", error)
		} else {
			set({ gastos: data.map(mapGastoFromDB) })
		}
	},

	// 🔹 Criar novo gasto
	addGasto: async (gasto) => {
		const {
			data: { user }
		} = await supabase.auth.getUser()

		const { data, error } = await supabase
			.from("gastos_diarios")
			.insert([
				{
					descricao_gasto: gasto.descricaoGasto,
					valor_gasto: gasto.valorGasto,
					created_by: user.id
				}
			])
			.select()

		if (error) {
			console.error("Erro ao adicionar gasto:", error)
			return null
		} else {
			const mapped = data.map(mapGastoFromDB)
			set((state) => ({ gastos: [...state.gastos, ...mapped] }))
			return mapped[0]
		}
	},

	// 🔹 Atualizar gasto
	updateGasto: async (updated) => {
		const {
			data: { user }
		} = await supabase.auth.getUser()

		const { data, error } = await supabase
			.from("gastos_diarios")
			.update({
				descricao_gasto: updated.descricaoGasto,
				valor_gasto: updated.valorGasto,
				updated_by: user.id
			})
			.eq("id", updated.id)
			.select()

		if (error) {
			console.error("Erro ao atualizar gasto:", error)
			return null
		} else {
			const mapped = mapGastoFromDB(data[0])
			set((state) => ({
				gastos: state.gastos.map((g) => (g.id === updated.id ? mapped : g))
			}))
			return mapped
		}
	},

	// 🔹 Deletar gasto permanentemente
	deleteGasto: async (id) => {
		const { error } = await supabase
			.from("gastos_diarios")
			.delete()
			.eq("id", id)

		if (error) {
			console.error("Erro ao deletar gasto:", error)
		} else {
			set((state) => ({
				gastos: state.gastos.filter((g) => g.id !== id)
			}))
		}
	}
}))

export default useGastos
