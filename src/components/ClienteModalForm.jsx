import React from "react"
import { X } from "lucide-react"

export default function ClienteModalForm({
	show,
	onClose,
	form,
	setForm,
	salvarNovoCliente
}) {
	if (!show) return null

	return (
		<div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
			<div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90%] overflow-y-auto relative">
				{/* BOTÃO FECHAR */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
				>
					<X size={24} />
				</button>

				<h2 className="text-2xl font-bold mb-6 text-center">
					Cadastrar Novo Cliente
				</h2>

				{/* FORMULÁRIO */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Nome */}
					<div className="flex flex-col">
						<label className="text-sm font-semibold mb-1">
							Nome do Cliente
						</label>
						<input
							type="text"
							className="p-3 rounded-xl bg-gray-100 border border-gray-300 shadow-sm"
							value={form.nomeClienteNovo}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									nomeClienteNovo: e.target.value
								}))
							}
						/>
					</div>

					{/* Telefone */}
					<div className="flex flex-col">
						<label className="text-sm font-semibold mb-1">Telefone</label>
						<input
							type="text"
							className="p-3 rounded-xl bg-gray-100 border border-gray-300 shadow-sm"
							value={form.contatoClienteNovo}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									contatoClienteNovo: e.target.value
								}))
							}
						/>
					</div>

					{/* Veículo */}
					<div className="flex flex-col">
						<label className="text-sm font-semibold mb-1">
							Modelo do Veículo
						</label>
						<input
							type="text"
							className="p-3 rounded-xl bg-gray-100 border border-gray-300 shadow-sm"
							value={form.modeloCarro}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, modeloCarro: e.target.value }))
							}
						/>
					</div>

					{/* Placa */}
					<div className="flex flex-col">
						<label className="text-sm font-semibold mb-1">Placa</label>
						<input
							type="text"
							className="p-3 rounded-xl bg-gray-100 border border-gray-300 shadow-sm"
							value={form.placaCarro}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, placaCarro: e.target.value }))
							}
						/>
					</div>

					{/* Quantidade de Lavagens */}
					<div className="flex flex-col">
						<label className="text-sm font-semibold mb-1">
							Quantidade de Lavagens
						</label>
						<input
							type="number"
							className="p-3 rounded-xl bg-gray-100 border border-gray-300 shadow-sm"
							value={form.qntdServicosNovo}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									qntdServicosNovo: e.target.value
								}))
							}
						/>
					</div>
				</div>

				{/* BOTÃO SALVAR */}
				<button
					className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl w-full font-semibold shadow-sm cursor-pointer"
					onClick={salvarNovoCliente}
				>
					Salvar Cliente
				</button>
			</div>
		</div>
	)
}
