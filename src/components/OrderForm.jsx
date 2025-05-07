import React, { useState, useEffect } from "react"
import useOrders from "../store/useOrders"
import { v4 as uuidv4 } from "uuid"

const OrderForm = ({ editingOrder, setEditingOrder }) => {
	const { addOrder, updateOrder } = useOrders()
	const [form, setForm] = useState({
		dataHora: "",
		responsavel: "",
		carroNumero: "",
		modeloCarro: "",
		placaCarro: "",
		servicos: [],
		total: "",
		caixinha: "",
		formaPagamento: "",
		descricaoOutros: "",
		observacoes: "",
		status: "em processamento",
		notaFiscal: null,
		notaFiscalUrl: ""
	})

	useEffect(() => {
		if (editingOrder) setForm(editingOrder)
	}, [editingOrder])

	const handleChangeServico = (e) => {
		const { value, checked } = e.target
		setForm((prevForm) => ({
			...prevForm,
			servicos: checked
				? [...prevForm.servicos, value]
				: prevForm.servicos.filter((s) => s !== value)
		}))
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		const notaFiscalUrl =
			form.notaFiscal instanceof File
				? URL.createObjectURL(form.notaFiscal)
				: form.notaFiscalUrl || null
		const orderData = {
			...form,
			id: editingOrder ? form.id : uuidv4(),
			notaFiscalUrl
		}

		if (editingOrder) {
			updateOrder(orderData)
			setEditingOrder(null)
		} else {
			addOrder(orderData)
		}

		resetForm()
	}

	const handleConcluir = () => {
		const notaFiscalUrl =
			form.notaFiscal instanceof File
				? URL.createObjectURL(form.notaFiscal)
				: form.notaFiscalUrl || null

		const updatedForm = { ...form, status: "processada", notaFiscalUrl }

		updateOrder(updatedForm)
		setEditingOrder(null)
		resetForm()
	}

	const resetForm = () => {
		setForm({
			dataHora: "",
			responsavel: "",
			carroNumero: "",
			modeloCarro: "",
			placaCarro: "",
			servicos: [],
			total: "",
			caixinha: "",
			formaPagamento: "",
			descricaoOutros: "",
			observacoes: "",
			status: "em processamento",
			notaFiscal: null,
			notaFiscalUrl: ""
		})
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-10">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-4xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-5 md:p-10 rounded-xl shadow-lg space-y-6"
			>
				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Dados do Atendimento:
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="">
						<label htmlFor="dataHora" className="mb-2 block text-lg font-sans">
							Data e Hora:
						</label>
						<input
							id="dataHora"
							type="datetime-local"
							value={form.dataHora}
							onChange={(e) => setForm({ ...form, dataHora: e.target.value })}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="responsavel"
							className="mb-2 block text-lg font-sans"
						>
							Nome:
						</label>
						<input
							id="responsavel"
							type="text"
							placeholder="Responsável"
							value={form.responsavel}
							onChange={(e) =>
								setForm({ ...form, responsavel: e.target.value })
							}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="carroNumero"
							className="mb-2 block text-lg font-sans"
						>
							Numeração:
						</label>
						<input
							id="carroNumero"
							type="number"
							min={0}
							placeholder="Carro nº"
							value={form.carroNumero}
							onChange={(e) =>
								setForm({ ...form, carroNumero: e.target.value })
							}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full no-spinner"
							required
						/>
					</div>
				</div>
				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Dados do Veículo:
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="modelo" className="mb-2 block text-lg font-sans">
							Modelo:
						</label>
						<input
							id="modelo"
							type="text"
							placeholder="Modelo do carro"
							value={form.modeloCarro}
							onChange={(e) =>
								setForm({ ...form, modeloCarro: e.target.value })
							}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
							required
						/>
					</div>
					<div>
						<label htmlFor="placa" className="mb-2 block text-lg font-sans">
							Placa:
						</label>
						<input
							id="placa"
							type="text"
							placeholder="Placa do carro"
							value={form.placaCarro}
							onChange={(e) => setForm({ ...form, placaCarro: e.target.value })}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
							required
						/>
					</div>
				</div>
				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Serviços Solicitados:
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
					{[
						"Estacionamento",
						"Lavagem Geral",
						"Ducha",
						"Aspiração",
						"Higienização",
						"Aplicação de cera",
						"Polimento",
						"Uber/Táxi",
						"Carro Grande",
						"Carro Pequeno"
					].map((servico) => (
						<label
							key={servico}
							className="flex items-center gap-2 text-slate-900"
						>
							<input
								type="checkbox"
								value={servico}
								checked={form.servicos.includes(servico)}
								onChange={handleChangeServico}
							/>
							{servico}
						</label>
					))}
				</div>

				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Valor a Receber:
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="total" className="mb-2 block text-lg font-sans">
							Total a pagar:
						</label>
						<input
							id="total"
							type="number"
							min={0}
							step={0.1}
							placeholder="R$ 00,00"
							value={form.total}
							onChange={(e) => setForm({ ...form, total: e.target.value })}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full no-spinner"
							required
						/>
					</div>
					<div>
						<label htmlFor="caixinha" className="mb-2 block text-lg font-sans">
							Caixinha:
						</label>
						<input
							id="caixinha"
							type="number"
							min={0}
							step={0.1}
							placeholder="R$ 00,00"
							value={form.caixinha}
							onChange={(e) => setForm({ ...form, caixinha: e.target.value })}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full no-spinner"
						/>
					</div>
				</div>
				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Forma de Pagamento:
				</h2>
				<div className="flex flex-wrap gap-4 text-slate-900">
					{["Dinheiro", "Cartão de Crédito/Débito", "PIX", "Outros"].map(
						(forma, index, arr) => (
							<label key={forma} className="flex items-center gap-2">
								<input
									type="radio"
									name="formaPagamento"
									value={forma}
									defaultChecked={forma === "PIX"}
									onChange={(e) =>
										setForm({ ...form, formaPagamento: e.target.value })
									}
								/>
								{forma}
							</label>
						)
					)}
				</div>
				{form.formaPagamento === "Outros" && (
					<textarea
						placeholder="Descreva outra forma de pagamento"
						value={form.descricaoOutros}
						onChange={(e) =>
							setForm({ ...form, descricaoOutros: e.target.value })
						}
						className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full resize-none"
					/>
				)}

				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Observações:
				</h2>
				<textarea
					placeholder="Informações adicionais sobre o serviço"
					value={form.observacoes}
					onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
					className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full resize-none"
				/>

				<h2 className="font-mono text-2xl font-semibold text-slate-900">
					Anexar Nota Fiscal:
				</h2>
				<div className="space-y-2">
					<label className="cursor-pointer inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">
						Selecionar Arquivo
						<input
							type="file"
							accept="image/*"
							onChange={(e) =>
								setForm({ ...form, notaFiscal: e.target.files[0] })
							}
							className="hidden"
						/>
					</label>

					{form.notaFiscal && (
						<div className="text-sm text-green-700 font-bold">
							✅ Arquivo anexado:{" "}
							<span className="font-semibold">{form.notaFiscal.name}</span>
						</div>
					)}
				</div>

				<div className="flex flex-wrap gap-4">
					<button
						type="submit"
						className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
					>
						{editingOrder ? "Atualizar" : "Criar"} Ordem de Serviço
					</button>
					{form.status === "em processamento" && editingOrder && (
						<button
							type="button"
							onClick={handleConcluir}
							className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
						>
							Concluir
						</button>
					)}
				</div>
			</form>
		</div>
	)
}

export default OrderForm
