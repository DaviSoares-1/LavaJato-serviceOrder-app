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
					descricao: order.descricaoOutros || "Outro - não especificado"
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

	// Relatório Diário em Mensagem de WhatsApp
	const formatRelatorioMensagem = ({
		totalServicosPrestados,
		valoresRecebidos,
		vendasProdutos,
		valoresOutros,
		gastos
	}) => {
		const formatBRL = (valor) =>
			new Intl.NumberFormat("pt-BR", {
				style: "currency",
				currency: "BRL",
				minimumFractionDigits: 2
			}).format(Number(valor) || 0)

		let mensagem = `*RELATÓRIO DIÁRIO - JJ LAVA-JATO LTDA*\n`
		mensagem += `Data: ${new Date().toLocaleDateString("pt-BR")}\n\n`

		// 🔹 Quantidade de serviços
		mensagem += `*Serviços Prestados:* ${totalServicosPrestados}\n\n`

		// 🔹 Valores Recebidos
		mensagem += `*Valores Recebidos:*\n`
		mensagem += `- Dinheiro: ${formatBRL(valoresRecebidos.Dinheiro)}\n`
		mensagem += `- Crédito: ${formatBRL(valoresRecebidos.Crédito)}\n`
		mensagem += `- Débito: ${formatBRL(valoresRecebidos.Débito)}\n`
		mensagem += `- Código QR Pix: ${formatBRL(
			valoresRecebidos["Código QR Pix"]
		)}\n`
		mensagem += `- Caixinha: ${formatBRL(valoresRecebidos.Caixinha)}\n`
		mensagem += `- *Total:* ${formatBRL(valoresRecebidos.total)}\n\n`

		// 🔹 Vendas de Produtos
		if (vendasProdutos.length > 0) {
			mensagem += `*Vendas de Produtos:*\n`
			vendasProdutos.forEach((v) => {
				mensagem += `- ${v.nome_produto} (${
					v.quantidade_produto
				}x): ${formatBRL(v.valor_produto * v.quantidade_produto)}\n`
			})
			const totalProdutos = vendasProdutos.reduce(
				(acc, v) => acc + v.valor_produto * v.quantidade_produto,
				0
			)
			mensagem += `- *Total de Vendas:* ${formatBRL(totalProdutos)}\n\n`
		}

		// 🔹 Outros pagamentos
		if (valoresOutros?.detalhesRecebidos?.length > 0) {
			mensagem += `*Pagamentos Alternativos (Outros):*\n`
			valoresOutros.detalhesRecebidos.forEach((d) => {
				mensagem += `- ${d.descricao}: ${formatBRL(d.valor)}\n`
			})
			mensagem += `- *Total:* ${formatBRL(valoresOutros.recebidos)}\n\n`
		}

		// 🔹 Gastos
		if (gastos.length > 0) {
			mensagem += `*Gastos Diários:*\n`
			gastos.forEach((g) => {
				mensagem += `- ${g.descricaoGasto}: ${formatBRL(g.valorGasto)}\n`
			})
			const totalGastos = gastos.reduce((acc, g) => acc + g.valorGasto, 0)
			mensagem += `- *Total de Gastos:* ${formatBRL(totalGastos)}\n\n`
		}

		mensagem += `Relatório gerado automaticamente.\n`
		mensagem += `JJ LAVA-JATO LTDA`

		return encodeURIComponent(mensagem)
	}

	const handleLimparDados = async () => {
		if (!window.confirm("Tem certeza que deseja limpar todos os dados?")) return

		try {
			const {
				data: { user }
			} = await supabase.auth.getUser()

			// 🔹 Buscar somente as ordens do usuário atual
			const { data: orders } = await supabase
				.from("orders_storage")
				.select("id")
				.eq("created_by", user.id)

			if (orders?.length) {
				await supabase
					.from("orders_storage")
					.delete()
					.in(
						"id",
						orders.map((o) => o.id)
					)
			}

			// 🔹 Buscar somente os gastos do usuário atual
			const { data: gastos } = await supabase
				.from("gastos_diarios")
				.select("id")
				.eq("created_by", user.id)

			if (gastos?.length) {
				await supabase
					.from("gastos_diarios")
					.delete()
					.in(
						"id",
						gastos.map((g) => g.id)
					)
			}

			// 🔹 Deletar arquivos do bucket "notas-fiscais/notas"
			const { data: arquivos, error: listError } = await supabase.storage
				.from("notas-fiscais")
				.list("notas", { limit: 1000 }) // << ESSENCIAL!

			if (listError) {
				console.error("Erro ao listar arquivos:", listError)
			} else if (arquivos?.length) {
				const paths = arquivos.map((a) => `notas/${a.name}`)

				const { error: delError } = await supabase.storage
					.from("notas-fiscais")
					.remove(paths)

				if (delError) {
					console.error("Erro ao deletar arquivos:", delError)
				}
			}

			// 🔹 Limpar storage
			useOrders.setState({ orders: [], deletedOrders: [] })
			useGastos.setState({ gastos: [] })

			alert("Todos os dados foram apagados com sucesso!")
		} catch (err) {
			console.error(err)
			alert("Erro ao limpar dados")
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
		<div className="text-slate-50 space-y-8 max-w-5xl mx-auto">
			<h2 className="text-3xl font-extrabold text-center tracking-wide">
				📊 Relatório Diário
			</h2>

			{/* GRID PRINCIPAL */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{/* Quantidade de Veículos */}
				<div className="bg-yellow-500/90 backdrop-blur-md shadow-lg rounded-2xl p-5 border border-yellow-300">
					<h3 className="text-xl font-semibold mb-3">
						🚗 Quantidade de Veículos
					</h3>
					<p className="text-4xl font-bold">{totalServicosPrestados}</p>
				</div>

				{/* Valores a Receber */}
				<div className="bg-sky-500/90 backdrop-blur-md shadow-lg rounded-2xl p-5 border border-sky-300">
					<h3 className="text-xl font-semibold mb-3">💸 Valores a Receber</h3>
					<p className="text-4xl font-bold">
						{formatarBRL(valoresReceber.total)}
					</p>
				</div>

				{/* Valores Recebidos */}
				<div className="bg-lime-500/90 backdrop-blur-md shadow-lg rounded-2xl p-5 border border-lime-300">
					<h3 className="text-xl font-semibold mb-3">💰 Valores Recebidos</h3>

					<ul className="space-y-1 text-lg">
						<li>• Dinheiro: {formatarBRL(valoresRecebidos.Dinheiro)}</li>
						<li>• Crédito: {formatarBRL(valoresRecebidos.Crédito)}</li>
						<li>• Débito: {formatarBRL(valoresRecebidos.Débito)}</li>
						<li>• Pix: {formatarBRL(valoresRecebidos["Código QR Pix"])}</li>
						<li>• Caixinha: {formatarBRL(valoresRecebidos.Caixinha)}</li>
					</ul>

					<p className="mt-3 text-lg font-extrabold">
						Total: {formatarBRL(valoresRecebidos.total)}
					</p>
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
				<div className="bg-emerald-600/90 backdrop-blur-md shadow-lg rounded-2xl p-5 border border-emerald-400 md:col-span-2 xl:col-span-1 h-80 flex flex-col">
					<h3 className="text-xl font-semibold mb-3 shrink-0">
						🛍️ Vendas de Produtos
					</h3>

					<div className="overflow-y-auto scrollbar-hidden pr-2 flex-1">
						{vendasProdutos.length === 0 ? (
							<p>Nenhum produto vendido hoje.</p>
						) : (
							<ul className="space-y-2 text-lg">
								{vendasProdutos.map((v, i) => (
									<li
										key={i}
										className="flex flex-col border-b border-white/20 pb-1"
									>
										<div className="flex justify-between">
											<span>• {v.nome_produto}</span>
											<span>({v.quantidade_produto}x)</span>
										</div>
										<span>
											{formatarBRL(v.valor_produto * v.quantidade_produto)}
										</span>
									</li>
								))}

								<li className="mt-2 font-bold text-xl">
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
				</div>

				{/* Pagamentos Alternativos */}
				<div className="bg-purple-700/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-purple-500 h-80 flex flex-col">
					<h3 className="text-2xl font-semibold mb-3 shrink-0">
						🧾 Pagamentos Alternativos
					</h3>

					<div className="overflow-y-auto scrollbar-hidden pr-2 flex-1">
						<ul className="space-y-1 text-lg">
							{valoresOutros.detalhesRecebidos.map((d, i) => (
								<li key={i}>
									• {formatarBRL(d.valor)} ({d.descricao})
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Controle de Gastos */}
				<div className="bg-red-700/90 backdrop-blur-md shadow-lg rounded-2xl p-5 border border-red-400 h-80 flex flex-col">
					<h3 className="text-2xl font-semibold mb-4 text-slate-100 shrink-0">
						🗂️ Controle de Gastos
					</h3>

					<button
						onClick={() => {
							setGastoEditandoIndex(null)
							setDescricaoGasto("")
							setValorGasto("")
							setMostrarInputs(true)
						}}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md cursor-pointer font-semibold w-full shrink-0"
					>
						Adicionar Gasto
					</button>

					{/* LISTA COM SCROLL */}
					<div className="mt-4 overflow-y-auto scrollbar-hidden pr-2 flex-1">
						<ul className="space-y-3">
							{gastos.map((g, i) => (
								<li
									key={i}
									className="bg-red-800/40 p-4 rounded-xl border border-red-500/20 shadow-sm text-slate-100 flex flex-col gap-2"
								>
									<div className="flex flex-col">
										<span className="text-lg font-semibold leading-tight">
											• {g.descricaoGasto.toUpperCase()}
										</span>
										<span className="text-base opacity-90">
											{formatarBRL(g.valorGasto)}
										</span>
									</div>

									<div className="flex gap-2 pt-1">
										<button
											className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded-lg cursor-pointer shadow w-full font-semibold"
											onClick={() => {
												setGastoEditandoIndex(i)
												setGastoEditado({ ...g })
												setMostrarInputs(true)
											}}
										>
											Editar
										</button>

										<button
											className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg cursor-pointer shadow w-full font-semibold"
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
									</div>
								</li>
							))}

							<li className="text-slate-100 font-bold text-xl p-3 bg-red-900/40 rounded-xl border border-red-600/30 shadow">
								• Total de Gastos: {formatarBRL(totalGastos)}
							</li>
						</ul>
					</div>
				</div>

				{/* ================================
   MODAL ADICIONAR / EDITAR GASTO
================================== */}
				{mostrarInputs && (
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
						<div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
							<h2 className="text-2xl font-bold mb-4 text-center">
								{gastoEditandoIndex !== null
									? "Editar Gasto"
									: "Adicionar Gasto"}
							</h2>

							<div className="space-y-4">
								<input
									type="text"
									placeholder="Descrição do gasto"
									className="p-3 text-base rounded-xl bg-gray-100 border border-gray-300 w-full shadow-sm"
									value={
										gastoEditandoIndex !== null
											? gastoEditado.descricaoGasto
											: descricaoGasto
									}
									onChange={(e) =>
										gastoEditandoIndex !== null
											? setGastoEditado((prev) => ({
													...prev,
													descricaoGasto: e.target.value
											  }))
											: setDescricaoGasto(e.target.value)
									}
								/>

								<input
									type="number"
									min={0}
									step={0.1}
									placeholder="Valor (R$)"
									className="p-3 text-base rounded-xl bg-gray-100 border border-gray-300 w-full shadow-sm"
									value={
										gastoEditandoIndex !== null
											? gastoEditado.valorGasto
											: valorGasto
									}
									onChange={(e) =>
										gastoEditandoIndex !== null
											? setGastoEditado((prev) => ({
													...prev,
													valorGasto: parseFloat(e.target.value)
											  }))
											: setValorGasto(e.target.value)
									}
								/>

								{/* Botões do modal */}
								<div className="flex gap-3 mt-4">
									<button
										className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl w-full font-semibold cursor-pointer"
										onClick={async () => {
											if (gastoEditandoIndex !== null) {
												await updateGasto(gastoEditado)
												setGastoEditandoIndex(null)
											} else {
												await handleAdicionarGasto()
											}
											setMostrarInputs(false)
										}}
									>
										{gastoEditandoIndex !== null
											? "Salvar Alterações"
											: "Adicionar"}
									</button>

									<button
										className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl w-full font-semibold cursor-pointer"
										onClick={() => {
											setMostrarInputs(false)
											setGastoEditandoIndex(null)
										}}
									>
										Cancelar
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="flex flex-wrap gap-4 items-center">
				{/* BLOCO DE UPLOAD — Altura fixa para alinhamento perfeito */}
				<div className="flex flex-col justify-center min-h-[90px]">
					{/* Botão Anexar */}
					<label
						className={`inline-block px-6 py-3 rounded-lg text-lg shadow-xl/20 text-white font-bold ${
							notaFiscal
								? "bg-gray-400 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700 cursor-pointer"
						}`}
					>
						🗒️ Anexar Nota
						<input
							type="file"
							accept="application/pdf,image/*"
							onChange={handleNotaFiscalChange}
							ref={fileInputRef}
							disabled={!!notaFiscal}
							className="hidden"
						/>
					</label>

					{/* Feedback do arquivo */}
					{notaFiscal && (
						<div className="mt-2 leading-tight">
							<p className="text-green-400 font-bold text-sm">
								✅ Arquivo anexado:
							</p>
							<span className="block text-sm max-w-52 break-all text-white">
								{notaFiscal}
							</span>

							<button
								type="button"
								onClick={handleRemoverArquivo}
								className="mt-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs shadow-xl/20 cursor-pointer w-fit"
							>
								Remover Arquivo
							</button>
						</div>
					)}
				</div>

				{/* Botões */}
				<button
					onClick={handleGerarRelatorio}
					className="bg-green-600 hover:bg-green-800 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-xl/20 cursor-pointer"
				>
					📥 Gerar Relatório Diário
				</button>

				<button
					onClick={handleLimparDados}
					className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-xl/20 cursor-pointer"
				>
					🧹 Limpar Dados e Resetar Sistema
				</button>

				<button
					onClick={() => {
						const numeroEmpresa = "5521997866541"
						const mensagem = formatRelatorioMensagem({
							totalServicosPrestados,
							valoresRecebidos,
							vendasProdutos,
							valoresOutros,
							gastos
						})
						const url = `https://wa.me/${numeroEmpresa}?text=${mensagem}`
						window.open(url, "_blank")
					}}
					className="bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-xl/20 hover:scale-105 transition-transform cursor-pointer"
				>
					📱 Enviar Relatório via WhatsApp
				</button>
			</div>
		</div>
	)
}

export default RelatorioDiario
