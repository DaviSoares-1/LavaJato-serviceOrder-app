import React, { useState, useMemo, useEffect, useRef } from "react"
import useOrders from "../store/useOrders"
import useGastos from "../store/useGastos"
import { generateRelatorioDiarioPDF } from "../utils/RelatorioPDF"
import { supabase } from "../supabaseClient"
import { uploadNotaFiscal, deleteNotaFiscal } from "../utils/uploadNotaFiscal"
import Toast from "./Toast"

function RelatorioDiario() {
	const { orders, deletedOrders } = useOrders()
	const { gastos, fetchGastos, addGasto, updateGasto, deleteGasto } =
		useGastos()
	const [descricaoGasto, setDescricaoGasto] = useState("")
	const [valorGasto, setValorGasto] = useState("")
	const [mostrarInputs, setMostrarInputs] = useState(false)
	const [gastoEditandoIndex, setGastoEditandoIndex] = useState(null)
	const [gastoEditado, setGastoEditado] = useState({
		descricaoGasto: "",
		valor: 0
	})
	const [notaFiscal, setNotaFiscal] = useState(null) // nome do arquivo
	const [notaFiscalFile, setNotaFiscalFile] = useState(null) // objeto File
	const [notaFiscalUrl, setNotaFiscalUrl] = useState(null) // URL pública
	const [notaFiscalPath, setNotaFiscalPath] = useState(null) // path no storage
	const fileInputRef = useRef(null)
	const [showToast, setShowToast] = useState(false)
	const [toastMessage, setToastMessage] = useState("")
	const [toastType, setToastType] = useState("success")

	// 🔹 Carrega gastos do Supabase
	useEffect(() => {
		fetchGastos()
	}, [fetchGastos])

	const formatarBRL = (valor) => {
		if (valor === undefined || valor === null || isNaN(valor)) {
			return (0).toLocaleString("pt-BR", {
				style: "currency",
				currency: "BRL"
			})
		}
		return Number(valor).toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL"
		})
	}

	const triggerToast = (message, type = "success") => {
		setToastMessage(message)
		setToastType(type)
		setShowToast(true)
		setTimeout(() => setShowToast(false), 3000)
	}

	// Selecionar arquivo
	const handleNotaFiscalChange = (e) => {
		const file = e.target.files[0]
		if (!(file instanceof File)) return

		e.target.value = null
		setNotaFiscal(file.name)
		setNotaFiscalFile(file)
		setNotaFiscalUrl(null)
		setNotaFiscalPath(null)
	}

	// Remover arquivo do Relatório Diário
	const handleRemoverArquivo = async () => {
		try {
			if (notaFiscalPath) {
				const { error } = await deleteNotaFiscal(notaFiscalPath)
				if (error) {
					console.error("Erro ao remover arquivo do bucket:", error)
					triggerToast("Erro ao remover arquivo do bucket!", "error")
					return
				}
			}

			// 🔹 Resetar estados locais
			setNotaFiscal(null)
			setNotaFiscalFile(null)
			setNotaFiscalUrl(null)
			setNotaFiscalPath(null)

			// 🔹 Resetar input file
			if (fileInputRef.current) {
				fileInputRef.current.value = null
			}

			triggerToast("Arquivo removido com sucesso!", "success")
		} catch (err) {
			console.error("Erro inesperado ao remover arquivo:", err)
			triggerToast("Erro inesperado ao remover arquivo!", "error")
		}
	}

	// 🔹 Valores a Receber
	const valoresReceber = useMemo(() => {
		let totalSemFormaPagamento = 0

		const todasAsOrdens = [...orders, ...deletedOrders]

		todasAsOrdens.forEach((order) => {
			if (order.status === "em processamento" && !order.forma_pagamento) {
				totalSemFormaPagamento +=
					// parseFloat(order.total || 0) + parseFloat(order.cantina || 0)
					parseFloat(order.total || 0) +
					parseFloat(order.valorProduto * order.quantidadeProduto || 0)
			}
		})

		return {
			total: totalSemFormaPagamento
		}
	}, [orders, deletedOrders])

	// 🔹 Valores Recebidos
	const valoresRecebidos = useMemo(() => {
		const totais = {
			Dinheiro: 0,
			Crédito: 0,
			Débito: 0,
			"Código QR Pix": 0,
			Outros: 0,
			Caixinha: 0
			// Cantina: 0
		}

		const todasAsOrdens = [...orders, ...deletedOrders]

		todasAsOrdens.forEach((order) => {
			if (order.status === "processada" && order.forma_pagamento) {
				const valor = parseFloat(order.total || 0)
				const caixinha = parseFloat(order.caixinha || 0)
				const venda = parseFloat(
					order.valorProduto * order.quantidadeProduto || 0
				)
				// const cantina = parseFloat(order.cantina || 0)

				if (totais.hasOwnProperty(order.forma_pagamento)) {
					// totais[order.forma_pagamento] += valor + cantina
					totais[order.forma_pagamento] += valor + venda
				} else {
					// totais.Outros += valor + cantina
					totais.Outros += valor
				}

				totais.Caixinha += caixinha
				// totais.Cantina += cantina
			}
		})

		return {
			...totais,
			total:
				totais.Dinheiro +
				totais.Crédito +
				totais.Débito +
				totais["Código QR Pix"] +
				totais.Outros
		}
	}, [orders, deletedOrders])

	// 🔹 Vendas da Cantina
	// const valoresCantina = useMemo(() => {
	// 	const totaisCantina = {
	// 		Dinheiro: 0,
	// 		Crédito: 0,
	// 		Débito: 0,
	// 		"Código QR Pix": 0,
	// 		Outros: 0
	// 	}

	// 	const todasAsOrdens = [...orders, ...deletedOrders]

	// 	todasAsOrdens.forEach((order) => {
	// 		if (order.status === "processada" && order.forma_pagamento) {
	// 			const cantina = parseFloat(order.cantina || 0)

	// 			if (totaisCantina.hasOwnProperty(order.forma_pagamento)) {
	// 				totaisCantina[order.forma_pagamento] += cantina
	// 			} else {
	// 				totaisCantina.Outros += cantina
	// 			}
	// 		}
	// 	})

	// 	return {
	// 		...totaisCantina,
	// 		total:
	// 			totaisCantina.Dinheiro +
	// 			totaisCantina.Crédito +
	// 			totaisCantina.Débito +
	// 			totaisCantina["Código QR Pix"] +
	// 			totaisCantina.Outros
	// 	}
	// }, [orders, deletedOrders])

	// 🔹 Valores de "Outros"
	const valoresOutros = useMemo(() => {
		const totaisOutros = {
			recebidos: 0,
			detalhesRecebidos: []
		}

		const todasAsOrdens = [...orders, ...deletedOrders]

		todasAsOrdens.forEach((order) => {
			if (order.status === "processada" && order.forma_pagamento === "Outros") {
				const valor =
					// parseFloat(order.total || 0) + parseFloat(order.cantina || 0)
					parseFloat(order.total || 0)

				totaisOutros.recebidos += valor
				totaisOutros.detalhesRecebidos.push({
					valor,
					descricao: order.descricaoOutros || "Outro (não especificado)"
				})
			}
		})

		return totaisOutros
	}, [orders, deletedOrders])

	const totalGastos = gastos.reduce((acc, g) => acc + g.valorGasto, 0)

	const totalServicosPrestados = orders.length + deletedOrders.length

	// 🔹 Considera também as ordens deletadas para somar todas as vendas de produtos
	const vendasProdutos = [...orders, ...deletedOrders].filter(
		(order) => order.venda_produtos_ativa && order.nome_produto
	)

	// 🔹 Adicionar gasto no Supabase
	const handleAdicionarGasto = async () => {
		if (descricaoGasto.trim() && parseFloat(valorGasto) >= 0) {
			await addGasto({ descricaoGasto, valorGasto: parseFloat(valorGasto) })
			setDescricaoGasto("")
			setValorGasto("")
		}
	}

	const handleLimparDados = async () => {
		if (
			window.confirm(
				"Tem certeza que deseja limpar todos os dados? Essa ação é irreversível."
			)
		) {
			try {
				// 🔹 Busca todas as ordens e deleta em lote
				const { data: orders, error: fetchOrdersError } = await supabase
					.from("orders_storage")
					.select("id")

				if (fetchOrdersError) throw fetchOrdersError

				if (orders?.length) {
					const { error: deleteOrdersError } = await supabase
						.from("orders_storage")
						.delete()
						.in(
							"id",
							orders.map((o) => o.id)
						)

					if (deleteOrdersError) throw deleteOrdersError
				}

				// 🔹 Busca todos os gastos e deleta em lote
				const { data: gastos, error: fetchGastosError } = await supabase
					.from("gastos_diarios")
					.select("id")

				if (fetchGastosError) throw fetchGastosError

				if (gastos?.length) {
					const { error: deleteGastosError } = await supabase
						.from("gastos_diarios")
						.delete()
						.in(
							"id",
							gastos.map((g) => g.id)
						)

					if (deleteGastosError) throw deleteGastosError
				}

				// 🔹 Remove todos os arquivos da pasta /notas no bucket notas-fiscais
				const { data: files, error: listError } = await supabase.storage
					.from("notas-fiscais")
					.list("notas")

				if (listError) throw listError

				if (files?.length) {
					const filePaths = files.map((f) => `notas/${f.name}`)
					const { error: removeError } = await supabase.storage
						.from("notas-fiscais")
						.remove(filePaths)

					if (removeError) throw removeError
				}

				// 🔹 Atualiza os estados locais (limpa a store)
				useOrders.setState({ orders: [], deletedOrders: [] })
				useGastos.setState({ gastos: [] })

				// 🔹 Feedback para o usuário
				alert("Todos os dados foram apagados com sucesso!")
			} catch (error) {
				console.error("Erro ao limpar dados:", error)
				alert("Erro ao limpar os dados. Confira o console para detalhes.")
			}
		}
	}

	const handleGerarRelatorio = async () => {
		let finalNotaFiscalUrl = notaFiscalUrl
		let finalNotaFiscalName = notaFiscal
		let finalNotaFiscalPath = notaFiscalPath

		if (notaFiscalFile instanceof File) {
			const result = await uploadNotaFiscal(notaFiscalFile, Date.now(), "notas")
			if (!result) {
				triggerToast("Erro ao enviar nota fiscal do relatório!", "error")
				return
			}
			finalNotaFiscalUrl = result.url
			finalNotaFiscalName = result.name
			finalNotaFiscalPath = result.path
			setNotaFiscalUrl(result.url)
			setNotaFiscal(result.name)
			setNotaFiscalPath(result.path)
		}
		generateRelatorioDiarioPDF({
			totalServicosPrestados,
			valoresRecebidos,
			valoresOutros,
			// valoresCantina,
			vendasProdutos,
			gastos,
			notaFiscalUrl: finalNotaFiscalUrl,
			notaFiscal: finalNotaFiscalName,
			notaFiscalPath: finalNotaFiscalPath
		})
		triggerToast("Relatório Diário gerado com sucesso!", "success")
	}

	return (
		<div className="text-slate-900 space-y-6">
			<h2 className="text-xl md:text-3xl font-bold text-white text-center mb-4">
				📊 Relatório Diário
			</h2>

			{/* Quantidade de Veículos */}
			<div className="bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-lg p-4">
				<h3 className="text-xl font-semibold mb-2">
					🚗 Quantidade de Veículos:
				</h3>
				<ul className="space-y-1">
					<li>
						<span className="font-bold">• Total de serviços prestados: </span>
						{totalServicosPrestados}
					</li>
				</ul>
			</div>

			{/* Valores a Receber */}
			<div className="bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg p-4">
				<h3 className="text-xl font-semibold mb-2">💸 Valores a Receber:</h3>
				<ul className="space-y-1">
					<li>
						<span className="font-bold">• Total a ser recebido: </span>
						{formatarBRL(valoresReceber.total)}
					</li>
				</ul>
			</div>

			{/* Valores Recebidos */}
			<div className="bg-gradient-to-br from-lime-400 to-lime-600 rounded-lg p-4">
				<h3 className="text-xl font-semibold mb-2">💰 Valores Recebidos:</h3>
				<ul className="space-y-1">
					<li>
						{" "}
						<span className="font-bold">• Dinheiro: </span>{" "}
						{formatarBRL(valoresRecebidos.Dinheiro)}
					</li>
					<li>
						{" "}
						<span className="font-bold">• Crédito </span>{" "}
						{formatarBRL(valoresRecebidos.Crédito)}
					</li>
					<li>
						{" "}
						<span className="font-bold">• Débito: </span>{" "}
						{formatarBRL(valoresRecebidos.Débito)}
					</li>
					<li>
						{" "}
						<span className="font-bold">• Código QR Pix: </span>{" "}
						{formatarBRL(valoresRecebidos["Código QR Pix"])}
					</li>
					<li>
						{" "}
						<span className="font-bold">• Caixinhas: </span>{" "}
						{formatarBRL(valoresRecebidos.Caixinha)}
					</li>
					<li>
						{" "}
						<span className="font-bold">• Faturamento Total: </span>{" "}
						{formatarBRL(valoresRecebidos.total)}
					</li>
				</ul>
			</div>

			{/* Vendas da Cantina */}
			{/* <div className="bg-gradient-to-br from-lime-400 to-lime-600 rounded-lg p-4">
				<h3 className="text-xl font-semibold mb-2">🍔 Vendas da Cantina:</h3>
				<ul className="space-y-1">
					<li>
						<span className="font-bold">• Dinheiro: </span>
						{formatarBRL(valoresCantina.Dinheiro)}
					</li>
					<li>
						<span className="font-bold">• Crédito: </span>
						{formatarBRL(valoresCantina.Crédito)}
					</li>
					<li>
						<span className="font-bold">• Débito: </span>
						{formatarBRL(valoresCantina.Débito)}
					</li>
					<li>
						<span className="font-bold">• Código QR Pix: </span>
						{formatarBRL(valoresCantina["Código QR Pix"])}
					</li>
					<li>
						<span className="font-bold">• Faturamento Total: </span>
						{formatarBRL(valoresCantina.total)}
					</li>
				</ul>
			</div> */}

			{/* Vendas de Produtos */}
			<div className="bg-gradient-to-br from-lime-400 to-lime-600 rounded-lg p-4 mt-6">
				<h3 className="text-xl font-semibold mb-2">🛍️ Vendas de Produtos:</h3>

				{vendasProdutos.length === 0 ? (
					<p>Nenhum produto vendido hoje.</p>
				) : (
					<ul className="mt-4 space-y-2">
						{vendasProdutos.map((v, i) => (
							<li
								key={i}
								className="flex flex-wrap justify-between border-b border-gray-500 pb-1"
							>
								<span>
									• {v.nome_produto} ({v.quantidade_produto}x)
								</span>
								<span>
									{formatarBRL(v.valor_produto * v.quantidade_produto)}
								</span>
							</li>
						))}

						<li className="mt-2 font-bold">
							Total:{" "}
							{formatarBRL(
								vendasProdutos.reduce(
									(acc, v) => acc + v.valor_produto * v.quantidade_produto,
									0
								)
							)}
						</li>
					</ul>
				)}
			</div>

			<div className="bg-gradient-to-br from-purple-900 to-purple-600 rounded-lg p-4 mt-4 text-white shadow-lg">
				<h3 className="text-xl font-semibold mb-2">
					🧾 Pagamentos Pendentes/Alternativos:
				</h3>
				<ul className="list-disc ml-6 space-y-1">
					{valoresOutros.detalhesRecebidos.map((d, i) => (
						<li key={i}>
							{formatarBRL(d.valor)}{" "}
							<span className="italic text-gray-200">({d.descricao})</span>
						</li>
					))}
				</ul>
			</div>

			{/* Controle de Gastos */}
			<div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-4">
				<h3 className="text-xl font-semibold mb-2 text-slate-200">
					🗂️ Controle de Gastos:
				</h3>
				<label className="flex items-center gap-2 mb-4 text-slate-200">
					<input
						type="checkbox"
						checked={mostrarInputs}
						onChange={() => setMostrarInputs(!mostrarInputs)}
					/>
					Adicionar Gastos Diários
				</label>

				{mostrarInputs && (
					<div className="space-y-4">
						<input
							type="text"
							placeholder="Descrição do gasto"
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
							value={descricaoGasto}
							onChange={(e) => setDescricaoGasto(e.target.value)}
						/>
						<input
							type="number"
							min={0}
							step={0.1}
							placeholder="R$ 00,00"
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full no-spinner"
							value={valorGasto}
							onChange={(e) => setValorGasto(e.target.value)}
						/>
						<button
							onClick={handleAdicionarGasto}
							className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-xl/20"
						>
							Adicionar Gasto
						</button>
					</div>
				)}

				<ul className="mt-4 space-y-2">
					{gastos.map((g, i) => (
						<li
							key={i}
							className="text-lg flex items-center gap-2 flex-wrap text-slate-200"
						>
							{gastoEditandoIndex === i ? (
								<>
									<input
										type="text"
										className="p-1 rounded bg-gray-200 border border-gray-500 text-gray-900"
										value={gastoEditado.descricaoGasto}
										onChange={(e) =>
											setGastoEditado((prev) => ({
												...prev,
												descricaoGasto: e.target.value
											}))
										}
									/>
									<input
										type="number"
										min={0}
										step={0.1}
										className="p-1 rounded bg-gray-200 border border-gray-500 text-gray-900"
										value={gastoEditado.valorGasto}
										onChange={(e) =>
											setGastoEditado((prev) => ({
												...prev,
												valorGasto: parseFloat(e.target.value)
											}))
										}
									/>
									<button
										className="bg-green-600 text-white px-2 py-1 rounded cursor-pointer shadow-xl/20"
										onClick={async () => {
											await updateGasto(gastoEditado)
											setGastoEditandoIndex(null)
										}}
									>
										Salvar
									</button>
									<button
										className="bg-gray-500 text-white px-2 py-1 rounded cursor-pointer shadow-xl/20"
										onClick={() => setGastoEditandoIndex(null)}
									>
										Cancelar
									</button>
								</>
							) : (
								<>
									<span className="font-bold">
										• {g.descricaoGasto.toUpperCase()}:{" "}
									</span>
									{formatarBRL(g.valorGasto)}
									<button
										className="bg-blue-700 text-white px-2 py-1 rounded ml-2 cursor-pointer shadow-xl/20"
										onClick={() => {
											setGastoEditandoIndex(i)
											setGastoEditado({ ...g })
										}}
									>
										Editar
									</button>
									<button
										className="bg-red-600 text-white px-2 py-1 rounded cursor-pointer shadow-xl/20"
										onClick={async () => {
											if (
												window.confirm("Deseja realmente excluir este gasto?")
											) {
												await deleteGasto(g.id)
											}
										}}
									>
										Excluir
									</button>
								</>
							)}
						</li>
					))}
					<li className="text-slate-200">
						<span className="font-bold">• Total de Gastos: </span>{" "}
						{formatarBRL(totalGastos)}
					</li>
				</ul>
			</div>

			<div className="flex gap-4 justify-center flex-wrap items-start">
				{/* Input de arquivo */}
				<div className="space-y-2">
					<label
						className={`inline-block px-4 py-2 rounded shadow-xl/20 text-white ${
							notaFiscal
								? "bg-gray-400 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700 cursor-pointer"
						}`}
					>
						Anexar Relatório Diário
						<input
							type="file"
							accept="application/pdf,image/*"
							onChange={handleNotaFiscalChange}
							ref={fileInputRef}
							disabled={!!notaFiscal}
							className="hidden"
						/>
					</label>

					{notaFiscal && (
						<div className="space-y-1">
							<div className="text-base text-green-400 font-bold">
								✅ Arquivo anexado:{" "}
								<span className="font-semibold max-w-3xs block">
									{notaFiscal}
								</span>
							</div>
							<button
								type="button"
								onClick={handleRemoverArquivo}
								className="inline-block bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm shadow-xl/20 cursor-pointer"
							>
								Remover Arquivo
							</button>
						</div>
					)}
				</div>
				<button
					onClick={handleGerarRelatorio}
					className="bg-green-600 hover:bg-green-800 text-white px-6 py-3 rounded-lg text-lg font-bold cursor-pointer shadow-xl/20"
				>
					📥 Gerar Relatório Diário
				</button>
				<button
					onClick={handleLimparDados}
					className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg text-lg font-bold cursor-pointer shadow-xl/20"
				>
					🧹 Limpar Dados e Resetar Sistema
				</button>
			</div>
		</div>
	)
}

export default RelatorioDiario
