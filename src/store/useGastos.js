// useGastos.js
import { create } from "zustand"
import { supabase } from "../supabaseClient"

const mapGastoFromDB = (g) => ({
	...g,
	descricaoGasto: g.descricao_gasto || "",
	valorGasto: parseFloat(g.valor_gasto) || 0
})

const useGastos = create((set, get) => ({
	gastos: [],

	// 🔹 Buscar todos os gastos
	fetchGastos: async () => {
		const { data, error } = await supabase
			.from("gastos_diarios")
			.select("*")
			.order("id", { ascending: true })

		if (!error) {
			set({ gastos: data.map(mapGastoFromDB) })
		}
	},

	// 🔥 Handlers locais usados pelo Realtime
	addGastoLocal: (novo) => {
		const gasto = mapGastoFromDB(novo)
		set((state) => ({
			gastos: [...state.gastos, gasto]
		}))
	},

	updateGastoLocal: (updated) => {
		const gasto = mapGastoFromDB(updated)
		set((state) => ({
			gastos: state.gastos.map((g) => (g.id === gasto.id ? gasto : g))
		}))
	},

	deleteGastoLocal: (id) => {
		set((state) => ({
			gastos: state.gastos.filter((g) => g.id !== id)
		}))
	},

	// 🔹 CRUD mantendo UI instantânea
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

		if (!error) return data[0]
	},

	updateGasto: async (updated) => {
		const { data, error } = await supabase
			.from("gastos_diarios")
			.update({
				descricao_gasto: updated.descricaoGasto,
				valor_gasto: updated.valorGasto
			})
			.eq("id", updated.id)
			.select()

		if (!error) return data[0]
	},

	deleteGasto: async (id) => {
		await supabase.from("gastos_diarios").delete().eq("id", id)
	}
}))

export default useGastos
