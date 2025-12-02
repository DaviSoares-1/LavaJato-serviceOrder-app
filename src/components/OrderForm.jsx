import React, {
	useState,
	useEffect,
	useImperativeHandle,
	forwardRef,
	useRef
} from "react"
import useOrders from "../store/useOrders"
import Toast from "./Toast"
import { uploadNotaFiscal, deleteNotaFiscal } from "../utils/uploadNotaFiscal"

function OrderForm({ editingOrder, setEditingOrder }, ref) {
	const fileInputRef = useRef(null)
	const { addOrder, updateOrder, orders, deletedOrders } = useOrders()
	const [form, setForm] = useState({
		dataHora: "",
		responsavel: "",
		carroNumero: "",
		modeloCarro: "",
		placaCarro: "",
		tipoVeiculo: [],
		servicos: [],
		total: "",
		caixinha: "",
		vendaProdutosAtiva: "",
		nomeProduto: "",
		valorProduto: "",
		quantidadeProduto: "",
		formaPagamento: "",
		descricaoOutros: "",
		observacoes: "",
		status: "em processamento",
		notaFiscal: null, // 👈 string com nome do arquivo
		notaFiscalUrl: null, // 👈 URL pública no supabase
		notaFiscalFile: null, // 👈 objeto File temporário
		notaFiscalPath: null, // 👈 caminho interno no Storage
	})
	const [showToast, setShowToast] = useState(false)
	const [toastMessage, setToastMessage] = useState("")
	const [toastType, setToastType] = useState("success")
	const [erroServicos, setErroServico] = useState(false)
	const [erroVeiculo, setErroVeiculo] = useState(false)
	const [erroNotaFiscal, setErroNotaFiscal] = useState(false)
	const localRef = React.useRef(null)

	useImperativeHandle(ref, () => ({
		resetForm,
		scrollIntoView: () => {
			localRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
		}
	}))

	useEffect(() => {
		if (editingOrder) {
			setForm({
				...editingOrder,
				dataHora: formatDateForInput(
					editingOrder.data_hora || editingOrder.dataHora
				),
				notaFiscal: editingOrder.nota_fiscal || editingOrder.notaFiscal || null,
				notaFiscalUrl:
					editingOrder.nota_fiscal_url || editingOrder.notaFiscalUrl || null,
				notaFiscalPath:
					editingOrder.nota_fiscal_path || editingOrder.notaFiscalPath || null
			})
		}
	}, [editingOrder])

	// 🔹 Função auxiliar para calcular o próximo número sequencial
	const getProximoNumero = () => {
		const maioresNumeros = [...orders, ...deletedOrders]
			.map((order) => Number(order.carroNumero))
			.filter((num) => !isNaN(num))

		return maioresNumeros.length > 0 ? Math.max(...maioresNumeros) + 1 : 1
	}

	// =================== Tabela de Preços ===================
	const tabelaVeiculos = {
		"Carro Pequeno": {
			"Lavagem Geral": 40,
			"Ducha com Secagem": 20
		},
		"Carro Grande": {
			"Lavagem Geral": 50,
			"Ducha com Secagem": 25
		},
		Moto: {
			"Lavagem Geral": 30,
			"Ducha com Secagem": 15
		},
		"Uber/Táxi": {
			"Lavagem Geral": 30,
			"Ducha com Secagem": 15
		}
		// se adicionar outros tipos, insira aqui
	}

	const tabelaServicosExtras = {
		"Aplicação de cera": 50,
		Polimento: 300,
		Higienização: 200
		// adicione mais extras quando necessário
	}

	// =================== Função: calcula preço base + extras ===================
	/**
	 * Retorna null se não houver informação suficiente (ex.: nenhum tipoVeiculo ou nenhum servico).
	 * Regra: para tipos múltiplos de veículo, calcula o total base para cada tipo e escolhe o menor resultado.
	 */
	const getPrecoAutomaticoSomado = (
		tipoVeiculoArray = [],
		servicosArray = []
	) => {
		if (!Array.isArray(tipoVeiculoArray) || !Array.isArray(servicosArray))
			return null
		if (tipoVeiculoArray.length === 0 || servicosArray.length === 0) return null

		// 1) Para cada tipo de veículo selecionado, soma os preços "principais" (tabelaVeiculos)
		const precosPorTipo = tipoVeiculoArray
			.map((tipo) => {
				if (!tabelaVeiculos[tipo]) return null // sem tabela para esse tipo
				let somaTipo = 0
				servicosArray.forEach((servico) => {
					const preco = tabelaVeiculos[tipo][servico]
					if (typeof preco === "number") somaTipo += preco
				})
				// se nenhum serviço principal mapeado para esse tipo, devolve null
				return somaTipo > 0 ? somaTipo : null
			})
			.filter((v) => v !== null) // remove tipos sem preço

		// Se nenhum tipo tem preço definido para os serviços selecionados, não podemos calcular
		if (precosPorTipo.length === 0) {
			// mas ainda podemos verificar se todos os serviços são apenas "extras" (sem base)
			// nesse caso base = 0 e seguimos para somar extras abaixo
			// aqui optamos por base = 0
		}

		// 2) escolhe o menor preço base entre os tipos (isso resolve Uber/Táxi + Carro Pequeno -> escolhe 30)
		const baseMinima = precosPorTipo.length > 0 ? Math.min(...precosPorTipo) : 0

		// 3) soma os serviços extras independentes do veículo
		let somaExtras = 0
		servicosArray.forEach((servico) => {
			if (tabelaServicosExtras[servico])
				somaExtras += tabelaServicosExtras[servico]
		})

		const total = baseMinima + somaExtras
		return total > 0 ? total : null
	}

	// =================== Preenche Total e Caixinha automaticamente ===================
	useEffect(() => {
		const preco = getPrecoAutomaticoSomado(form.tipoVeiculo, form.servicos)

		if (preco !== null) {
			setForm((prev) => ({
				...prev,
				total: preco,
				caixinha: 0
			}))
		}
		// se preco for null, não sobrescreve (mantém o que usuário já tenha digitado)
	}, [form.tipoVeiculo, form.servicos])

	// 🔹 Define automaticamente o próximo número sequencial quando não está editando
	useEffect(() => {
		if (!editingOrder) {
			setForm((prevForm) => ({
				...prevForm,
				carroNumero: getProximoNumero()
			}))
		}
	}, [editingOrder, orders, deletedOrders])

	const handleChangeVeiculo = (e) => {
		const { value, checked } = e.target
		setForm((prevForm) => ({
			...prevForm,
			tipoVeiculo: checked
				? [...prevForm.tipoVeiculo, value]
				: prevForm.tipoVeiculo.filter((s) => s !== value)
		}))
	}

	const handleChangeServico = (e) => {
		const { value, checked } = e.target
		setForm((prevForm) => ({
			...prevForm,
			servicos: checked
				? [...prevForm.servicos, value]
				: prevForm.servicos.filter((s) => s !== value)
		}))
	}

	const resetForm = (ultimaOrdem = null) => {
		const proximoNumero = ultimaOrdem
			? Number(ultimaOrdem.carro_numero || ultimaOrdem.carroNumero) + 1
			: getProximoNumero()

		setForm({
			dataHora: "",
			responsavel: "",
			carroNumero: proximoNumero,
			modeloCarro: "",
			placaCarro: "",
			tipoVeiculo: [],
			servicos: [],
			total: "",
			caixinha: "",
			vendaProdutosAtiva: "",
			nomeProduto: "",
			valorProduto: "",
			quantidadeProduto: "",
			formaPagamento: "",
			descricaoOutros: "",
			observacoes: "",
			status: "em processamento",
			notaFiscal: null, // 👈 string com nome do arquivo
			notaFiscalUrl: null, // 👈 URL pública no supabase
			notaFiscalFile: null, // 👈 objeto File temporário
			notaFiscalPath: null, // 👈 caminho interno no Storage
		})

		if (fileInputRef.current) {
			fileInputRef.current.value = null
		}
	}

	const formatInput = (str) => {
		if (!str || typeof str !== "string") return ""
		const cleaned = str.trim()
		return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
	}

	// ================= Helpers para datas =================
	const formatDateForInput = (isoString) => {
		if (!isoString) return ""
		const date = new Date(isoString)

		// Monta a string manualmente no fuso local
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, "0")
		const day = String(date.getDate()).padStart(2, "0")
		const hours = String(date.getHours()).padStart(2, "0")
		const minutes = String(date.getMinutes()).padStart(2, "0")

		return `${year}-${month}-${day}T${hours}:${minutes}`
	}

	const normalizeDateForDB = (value) => {
		return value ? new Date(value).toISOString() : null // volta para UTC ISO
	}
	// =====================================================

	// ================== CRUD Supabase ==================

	// ✅ Nova função utilitária
	const validarCamposObrigatorios = () => {
		let valido = true
		const camposFaltando = []

		// 🔹 Campos obrigatórios simples
		const camposObrigatorios = [
			{ campo: form.dataHora, nome: "Data/Hora" },
			{ campo: form.responsavel, nome: "Responsável" },
			{ campo: form.carroNumero, nome: "Numeração do carro" },
			{ campo: form.modeloCarro, nome: "Modelo do carro" },
			{ campo: form.placaCarro, nome: "Placa do carro" },
			{ campo: form.total, nome: "Valor total" },
			{ campo: form.caixinha, nome: "Caixinha" }
		]

		camposObrigatorios.forEach(({ campo, nome }) => {
			if (campo === "" || campo === null || campo === undefined) {
				camposFaltando.push(nome)
				valido = false
			}
		})

		// 🔹 Campos de seleção múltipla
		if (form.tipoVeiculo.length === 0) {
			setErroVeiculo(true)
			camposFaltando.push("Tipo de Veículo")
			valido = false
		} else {
			setErroVeiculo(false)
		}

		if (form.servicos.length === 0) {
			setErroServico(true)
			camposFaltando.push("Serviços Prestados")
			valido = false
		} else {
			setErroServico(false)
		}

		// 🔹 Validação da Nota Fiscal (apenas se for Cartão ou Pix)
		if (
			(form.formaPagamento === "Crédito" ||
				form.formaPagamento === "Débito" ||
				form.formaPagamento === "Código QR Pix") &&
			!(form.notaFiscalUrl || form.notaFiscalFile instanceof File)
		) {
			setErroNotaFiscal(true)
			camposFaltando.push("Nota Fiscal do Pagamento")
			valido = false
		} else {
			setErroNotaFiscal(false)
		}

		// 🔹 Exibe toast consolidado
		if (!valido && camposFaltando.length > 0) {
			const listaCampos = camposFaltando.join(", ")
			triggerToast(
				`Os campos obrigatórios: [${listaCampos}] devem ser preenchidos!`,
				"error"
			)
		}

		return valido
	}

	const handleSubmit = async (e, concluir = false) => {
		if (e && typeof e.preventDefault === "function") e.preventDefault()

		if (isCarroNumeroDuplicado()) {
			triggerToast(
				`A ordem número: (${form.carroNumero}) já foi adicionada!!`,
				"error"
			)
			return
		}

		if (!validarCamposObrigatorios()) return

		// Decide status inicial
		const deveProcessar = concluir || !!form.formaPagamento

		// monta os dados SEM a nota fiscal ainda
		const baseOrderData = {
			dataHora: normalizeDateForDB(form.dataHora),
			responsavel: form.responsavel.trim(),
			carroNumero: form.carroNumero,
			modeloCarro: form.modeloCarro.trim(),
			placaCarro: form.placaCarro.trim(),
			tipoVeiculo: form.tipoVeiculo,
			servicos: form.servicos,
			observacoes: formatInput(form.observacoes),
			total: form.total,
			caixinha: form.caixinha,
			vendaProdutosAtiva: form.vendaProdutosAtiva,
			nomeProduto: form.nomeProduto,
			valorProduto: form.valorProduto,
			quantidadeProduto: form.quantidadeProduto,
			formaPagamento: form.formaPagamento,
			descricaoOutros: formatInput(form.descricaoOutros),
			status: editingOrder
				? form.status
				: deveProcessar
				? "processada"
				: "em processamento"
		}

		if (editingOrder) {
			// 🔹 edição → faz upload se tiver arquivo
			let notaFiscalUrl = form.notaFiscalUrl
			let notaFiscalName = form.notaFiscal
			let notaFiscalPath = form.notaFiscalPath

			if (form.notaFiscalFile instanceof File) {
				const result = await uploadNotaFiscal(form.notaFiscalFile, form.id)
				if (!result) {
					triggerToast("Erro ao enviar nota fiscal!", "error")
					return
				}
				notaFiscalUrl = result.url
				notaFiscalName = result.name
				notaFiscalPath = result.path
			}

			await updateOrder({
				id: editingOrder.id,
				...baseOrderData,
				notaFiscal: notaFiscalName,
				notaFiscalUrl,
				notaFiscalPath
			})

			setEditingOrder(null)
			triggerToast(
				`A ordem número: (${
					form.carroNumero
				}) - Carro: ${form.modeloCarro.toUpperCase()} foi Editada.`,
				"edit"
			)
			resetForm()
		} else {
			// 🔹 nova ordem → cria primeiro sem nota fiscal
			const novaOrdem = await addOrder({
				...baseOrderData,
				notaFiscal: null,
				notaFiscalUrl: null,
				notaFiscalPath: null
			})

			if (!novaOrdem) {
				triggerToast("Erro ao criar ordem!", "error")
				return
			}

			// depois faz upload da nota se existir
			if (form.notaFiscalFile instanceof File) {
				const result = await uploadNotaFiscal(form.notaFiscalFile, novaOrdem.id)
				if (result) {
					await updateOrder({
						id: novaOrdem.id,
						notaFiscal: result.name,
						notaFiscalUrl: result.url,
						notaFiscalPath: result.path
					})
				}
			}

			triggerToast(
				`A ordem número: (${
					form.carroNumero
				}) - Carro: ${form.modeloCarro.toUpperCase()} foi Gerada.`,
				"success"
			)
			resetForm(novaOrdem)
		}
	}

	const handleConcluir = async () => {
		// 🔹 Verifica se todos os campos obrigatórios estão preenchidos
		if (!validarCamposObrigatorios()) {
			triggerToast(
				"Preencha todos os campos obrigatórios antes de concluir a ordem!",
				"error"
			)
			return
		}

		// 🔹 A forma de pagamento é obrigatória para concluir
		if (!form.formaPagamento) {
			triggerToast("Selecione uma forma de pagamento para concluir!", "error")
			return
		}

		let notaFiscalUrl = form.notaFiscalUrl
		let notaFiscalName = form.notaFiscal
		let notaFiscalPath = form.notaFiscalPath

		if (form.notaFiscalFile instanceof File) {
			const result = await uploadNotaFiscal(
				form.notaFiscalFile,
				form.id || Date.now()
			)
			if (!result) {
				triggerToast("Erro ao enviar nota fiscal!", "error")
				return
			}
			notaFiscalUrl = result.url
			notaFiscalName = result.name
			notaFiscalPath = result.path
		}

		const updatedForm = {
			id: form.id,
			dataHora: normalizeDateForDB(form.dataHora),
			responsavel: form.responsavel,
			carroNumero: form.carroNumero,
			modeloCarro: form.modeloCarro,
			placaCarro: form.placaCarro,
			tipoVeiculo: form.tipoVeiculo,
			servicos: form.servicos,
			observacoes: formatInput(form.observacoes),
			total: form.total,
			caixinha: form.caixinha,
			vendaProdutosAtiva: form.vendaProdutosAtiva,
			nomeProduto: form.nomeProduto,
			valorProduto: form.valorProduto,
			quantidadeProduto: form.quantidadeProduto,
			formaPagamento: form.formaPagamento,
			descricaoOutros: formatInput(form.descricaoOutros),
			status: "processada",
			notaFiscal: notaFiscalName,
			notaFiscalUrl: notaFiscalUrl,
			notaFiscalPath: notaFiscalPath
		}

		await updateOrder(updatedForm)

		triggerToast(
			`A ordem número: (${
				form.carroNumero
			}) - Carro: ${form.modeloCarro.toUpperCase()} foi Concluída.`,
			"success"
		)
		setEditingOrder(null)
		resetForm()
	}

	const handleReabrir = async () => {
		const updatedForm = {
			id: form.id,
			status: "em processamento",
			forma_pagamento: "", // limpa no banco
			observacoes: formatInput(form.observacoes),
			descricao_outros: formatInput(form.descricaoOutros)
		}

		await updateOrder(updatedForm)

		triggerToast(
			`A ordem número: (${
				form.carroNumero
			}) - Carro: ${form.modeloCarro.toUpperCase()} foi Reaberta.`,
			"reopen"
		)

		// 🔹 Aqui garantimos que o estado do formulário local seja resetado também
		setForm((prevForm) => ({
			...prevForm,
			status: "em processamento",
			formaPagamento: "", // limpa no estado local → radio input desmarca
			descricaoOutros: ""
		}))
	}

	const handleNotaFiscalChange = (e) => {
		const file = e.target.files[0]
		if (!(file instanceof File)) return

		// 🔹 Resetar o valor para permitir selecionar o mesmo arquivo novamente depois
		e.target.value = null

		setForm((prev) => ({
			...prev,
			notaFiscal: file.name,
			notaFiscalFile: file, // só guarda o objeto File
			notaFiscalUrl: null,
			notaFiscalPath: null
		}))
	}

	const handleRemoverArquivo = async () => {
		if (!form.id) {
			// ordem não criada, só limpa estado
			setForm((prev) => ({
				...prev,
				notaFiscal: null,
				notaFiscalFile: null,
				notaFiscalUrl: null,
				notaFiscalPath: null
			}))
			return
		}

		// 🔹 1. Remove do bucket
		if (form.notaFiscalPath) {
			await deleteNotaFiscal(form.notaFiscalPath)
		}

		// 🔹 2. Zera no banco
		const updated = await updateOrder({
			id: form.id,
			notaFiscal: null,
			notaFiscalUrl: null,
			notaFiscalPath: null
		})

		// 🔹 3. Zera no estado local
		if (updated) {
			setForm((prev) => ({
				...prev,
				notaFiscal: null,
				notaFiscalFile: null,
				notaFiscalUrl: null,
				notaFiscalPath: null
			}))
		}

		// 🔹 4. Resetar o input file
		if (fileInputRef.current) {
			fileInputRef.current.value = null
		}
	}

	const handleResetFormaPagamento = () => {
		setForm((prevForm) => ({
			...prevForm,
			formaPagamento: "",
			status: "em processamento" // volta para padrão
		}))
		triggerToast("Forma de pagamento resetada.", "edit")
	}

	// ==================================================

	// 🔹 Validação: não permite duplicar numeração em ordens ativas ou na lixeira
	const isCarroNumeroDuplicado = () => {
		return [...orders, ...deletedOrders].some(
			(order) =>
				String(order.carroNumero) === String(form.carroNumero) &&
				order.id !== form.id // permite manter o mesmo número ao editar
		)
	}

	const triggerToast = (message, type = "success") => {
		setToastMessage(message)
		setToastType(type)
		setShowToast(true)
		setTimeout(() => setShowToast(false), 3000)
	}

	return (
		<div
			ref={localRef}
			className="min-h-screen flex items-center justify-center p-4 flex-col "
		>
			<h2 className="text-3xl font-extrabold text-white text-center tracking-wide mb-8">
				📝 Ficha de Serviço
			</h2>
			{showToast && <Toast message={toastMessage} type={toastType} />}
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-4xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-5 md:p-10 rounded-xl shadow-lg space-y-6"
			>
				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Dados do Atendimento:
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="">
						<label
							htmlFor="dataHora"
							className="mb-2 block text-lg font-sans cursor-pointer"
						>
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
							className="mb-2 block text-lg font-sans cursor-pointer"
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
							className="mb-2 block text-lg font-sans cursor-pointer"
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
						<label
							htmlFor="modelo"
							className="mb-2 block text-lg font-sans cursor-pointer"
						>
							Modelo:
						</label>
						<input
							id="modelo"
							type="text"
							placeholder="Modelo do Veículo"
							value={form.modeloCarro}
							onChange={(e) =>
								setForm({ ...form, modeloCarro: e.target.value })
							}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="placa"
							className="mb-2 block text-lg font-sans cursor-pointer"
						>
							Placa:
						</label>
						<input
							id="placa"
							type="text"
							placeholder="Placa do Veículo"
							value={form.placaCarro}
							onChange={(e) => setForm({ ...form, placaCarro: e.target.value })}
							className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
							required
						/>
					</div>
				</div>
				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Tipo de Veículo:
				</h2>
				<div className="grid grid-cols-2 gap-2">
					{[
						"Uber/Táxi",
						"Carro Grande",
						"Carro Pequeno",
						"Moto",
						"Van",
						"Hunter",
					].map((veiculo) => (
						<label
							key={veiculo}
							className="flex items-center gap-2 text-slate-900 cursor-pointer"
						>
							<input
								type="checkbox"
								value={veiculo}
								checked={form.tipoVeiculo.includes(veiculo)}
								onChange={handleChangeVeiculo}
							/>
							{veiculo}
						</label>
					))}
					{/* 🔹 Mensagem de erro se nada foi marcado */}
					{erroVeiculo && (
						<p className="text-red-600 text-sm mt-2">
							Selecione pelo menos um tipo de veículo.
						</p>
					)}
				</div>

				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Serviços Solicitados:
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
					{[
						"Estacionamento",
						"Lavagem Geral",
						"Ducha com Secagem",
						"Ducha sem Secagem",
						"Limpeza interna",
						"Aspiração",
						"Higienização",
						"Aplicação de cera",
						"Hidratação de Bancos",
						"Aplicação de Produto",
						"Polimento",
						"Revitalização de Faróis"
					].map((servico) => (
						<label
							key={servico}
							className="flex items-center gap-2 text-slate-900 cursor-pointer"
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
					{/* 🔹 Mensagem de erro */}
					{erroServicos && (
						<p className="text-red-600 text-sm mt-2">
							Selecione pelo menos um serviço.
						</p>
					)}
				</div>

				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Observações:
				</h2>
				<textarea
					placeholder="Informações adicionais sobre o serviço"
					value={form.observacoes}
					onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
					className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full resize-none"
				/>

				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Valor a Receber:
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="total"
							className="mb-2 block text-lg font-sans cursor-pointer"
						>
							Total do Serviço:
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
						<label
							htmlFor="caixinha"
							className="mb-2 block text-lg font-sans cursor-pointer"
						>
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
					{/* Vendas de Produtos */}
					<div className="bg-gradient-to-br from-yellow-800 to-yellow-600 rounded-lg p-4 mt-6">
						<label className="flex items-center gap-2 mb-4 text-slate-200 text-lg font-sans cursor-pointer">
							<input
								type="checkbox"
								checked={form.vendaProdutosAtiva || false}
								onChange={(e) =>
									setForm({ ...form, vendaProdutosAtiva: e.target.checked })
								}
							/>
							Registrar Venda de Produto
						</label>

						{form.vendaProdutosAtiva && (
							<div className="space-y-4">
								<input
									type="text"
									placeholder="Nome do produto vendido"
									className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full"
									value={form.nomeProduto || ""}
									onChange={(e) =>
										setForm({ ...form, nomeProduto: e.target.value })
									}
								/>

								<input
									type="number"
									min={0}
									step={0.01}
									placeholder="Valor unitário (R$)"
									className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full no-spinner"
									value={form.valorProduto || ""}
									onChange={(e) =>
										setForm({ ...form, valorProduto: e.target.value })
									}
								/>

								<input
									type="number"
									min={1}
									step={1}
									placeholder="Quantidade vendida"
									className="p-3 text-base rounded-lg bg-gray-300 text-gray-900 border border-gray-600 w-full no-spinner"
									value={form.quantidadeProduto || ""}
									onChange={(e) =>
										setForm({ ...form, quantidadeProduto: e.target.value })
									}
								/>
							</div>
						)}
					</div>
				</div>
				<h2 className="font-mono text-2xl font-bold text-slate-900">
					Forma de Pagamento:
				</h2>
				<div className="flex flex-wrap gap-4 text-slate-900">
					{["Dinheiro", "Crédito", "Débito", "Código QR Pix", "Outros"].map(
						(forma) => (
							<label
								key={forma}
								className="flex items-center gap-2 cursor-pointer"
							>
								<input
									type="radio"
									name="formaPagamento"
									value={forma}
									checked={form.formaPagamento === forma}
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

				<h2 className="font-mono text-2xl font-semibold text-slate-900">
					Anexar Nota Fiscal:
				</h2>
				<div className="space-y-2">
					<label
						className={`inline-block px-4 py-2 rounded shadow-xl/20 text-white ${
							form.notaFiscal
								? "bg-gray-400 cursor-not-allowed"
								: "bg-gray-800 hover:bg-gray-700 cursor-pointer"
						}`}
					>
						Selecionar Arquivo
						<input
							type="file"
							accept="application/pdf,image/*"
							onChange={handleNotaFiscalChange}
							ref={fileInputRef}
							disabled={!!form.notaFiscal}
							className="hidden"
						/>
					</label>

					{form.notaFiscal && (
						<div className="space-y-1">
							<div className="text-base text-green-700 font-bold">
								✅ Arquivo anexado:{" "}
								<span className="font-semibold">{form.notaFiscal}</span>
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
					{/* 🔹 Mensagem de erro */}
					{erroNotaFiscal && (
						<p className="text-red-600 text-sm mt-2">
							Adicione a nota fiscal do pagamento.
						</p>
					)}
				</div>

				<div className="flex flex-wrap gap-4">
					<button
						type="button"
						onClick={(e) =>
							handleSubmit(e, !editingOrder && !!form.formaPagamento)
						}
						className={`px-6 py-2 rounded shadow-xl/20 text-white ${
							editingOrder
								? form.status === "em processamento" && !!form.formaPagamento
									? "bg-gray-400 cursor-not-allowed"
									: "bg-blue-600 hover:bg-blue-700 cursor-pointer"
								: "bg-blue-600 hover:bg-blue-700 cursor-pointer"
						}`}
						disabled={
							editingOrder &&
							form.status === "em processamento" &&
							!!form.formaPagamento
						}
					>
						{editingOrder
							? "Atualizar"
							: form.formaPagamento
							? "Criar e Concluir Ordem de Serviço"
							: "Criar Ordem de Serviço"}
					</button>

					{form.formaPagamento &&
						(!editingOrder ||
							(editingOrder && form.status === "em processamento")) && (
							<button
								type="button"
								onClick={handleResetFormaPagamento}
								className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded shadow-xl/20 cursor-pointer"
							>
								Resetar Forma de Pagamento
							</button>
						)}
					{editingOrder && (
						<>
							{form.status === "em processamento" && (
								<button
									type="button"
									onClick={handleConcluir}
									className={`px-6 py-2 rounded text-white shadow-xl/20 ${
										form.formaPagamento && !isCarroNumeroDuplicado()
											? "bg-green-600 hover:bg-green-700 cursor-pointer"
											: "bg-gray-400 cursor-not-allowed"
									}`}
									disabled={!form.formaPagamento || isCarroNumeroDuplicado()}
								>
									Concluir
								</button>
							)}
							{form.status === "processada" && (
								<button
									type="button"
									onClick={handleReabrir}
									className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded shadow-xl/20 cursor-pointer"
								>
									Reabrir Serviço
								</button>
							)}
						</>
					)}
				</div>
			</form>
		</div>
	)
}

export default forwardRef(OrderForm)
