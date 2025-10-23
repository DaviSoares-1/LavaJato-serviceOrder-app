import jsPDF from "jspdf"
import { fetchImageAsBase64 } from "./fetchImageAsBase64"

export const generatePDF = async (order) => {
	const doc = new jsPDF()
	let y = 10

	// 🔹 Normaliza a data/hora
	let formattedDateTime = ""
	if (order.dataHora) {
		const dateObj = new Date(order.dataHora)
		const dia = String(dateObj.getDate()).padStart(2, "0")
		const mes = String(dateObj.getMonth() + 1).padStart(2, "0")
		const ano = dateObj.getFullYear()
		const horas = String(dateObj.getHours()).padStart(2, "0")
		const minutos = String(dateObj.getMinutes()).padStart(2, "0")
		const segundos = String(dateObj.getSeconds()).padStart(2, "0")
		formattedDateTime = `${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos}`
	}

	// 🔹 Funções auxiliares
	const formatarBRL = (valor) =>
		new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
			minimumFractionDigits: 2
		}).format(Number(valor) || 0)

	const totalPagoFormatado = formatarBRL(order.total)
	const caixinhaFormatado = formatarBRL(order.caixinha)
	const valorProdutoFormatado = formatarBRL(order.valorProduto)

	// 🔹 Cabeçalho formal
	const addHeader = () => {
		doc.setFontSize(24)
		doc.setFont("helvetica", "bold")
		const headerY = 10
		doc.text("JJ LAVA-JATO LTDA", 105, headerY, null, null, "center")

		y += 7
		doc.setFontSize(12)
		doc.setFont("helvetica", "normal")
		doc.text("CNPJ: 58.736.525/0001-70", 105, y, null, null, "center")

		y += 7
		doc.text(
			"Endereço: Rua Açaituba, 26 - Jardim Carioca, Rio de Janeiro/RJ, 21931-520",
			105,
			y,
			null,
			null,
			"center"
		)

		y += 7
		doc.text(
			"Telefone: (21) 96756-4103 | Email: contato@jjlavajato.com",
			105,
			y,
			null,
			null,
			"center"
		)

		y += 10
		doc.setLineWidth(0.5)
		doc.line(10, y, 200, y)

		// Caixa com número da OS (alinhada exatamente na linha do título)
		doc.setFont("helvetica", "bold")
		doc.setFontSize(14)
		doc.rect(160, headerY - 8, 40, 10) // sobe um pouco a caixa para alinhar verticalmente
		doc.text(`Serviço Nº ${order.carroNumero}`, 162, headerY)

		y += 15
	}

	// 🔹 Rodapé
	const addFooter = () => {
		doc.setFontSize(10)
		doc.setFont("helvetica", "italic")
		doc.text(
			"Documento gerado automaticamente. Não possui valor fiscal.",
			105,
			290,
			null,
			null,
			"center"
		)
	}

	// 🔹 Bloco de seção
	const addSection = (title) => {
		doc.setFillColor(211, 211, 211)
		doc.rect(10, y, 190, 8, "F")
		doc.setFont("helvetica", "bold")
		doc.setFontSize(12)
		doc.text(title, 12, y + 6)
		y += 14
	}

	const addField = (label, value) => {
		doc.setFont("helvetica", "bold")
		doc.text(`${label}`, 12, y)
		doc.setFont("helvetica", "normal")
		doc.text(value || "", 60, y)
		y += 8
	}

	// 🔹 Montagem do PDF
	addHeader()

	addSection("Dados da Ordem")
	addField("Status:", order.status.toUpperCase())
	addField("Data e Hora:", formattedDateTime)
	addField("Responsável:", order.responsavel?.toUpperCase() || "-")

	addSection("Dados do Veículo")
	addField("Modelo:", order.modeloCarro?.toUpperCase() || "-")
	addField("Placa:", order.placaCarro?.toUpperCase() || "-")
	addField("Tipo:", order.tipoVeiculo.join(", "))

	addSection("Serviços Solicitados")
	order.servicos.forEach((s, i) => {
		doc.setFont("helvetica", "normal")
		doc.text(`${i + 1}. ${s}`, 15, y)
		y += 7
	})
	y += 5

	addSection("Resumo Financeiro")
	addField("Total do Serviço:", totalPagoFormatado)
	addField("Venda de Produto:", valorProdutoFormatado)
	addField("Caixinha:", caixinhaFormatado)
	addField("Forma de Pagamento:", order.formaPagamento)

	if (order.formaPagamento === "Outros") {
		addField("Descrição:", order.descricaoOutros || "-")
	}

	addSection("Observações")
	if (order.observacoes) {
		const obsLines = doc.splitTextToSize(order.observacoes, 180)
		obsLines.forEach((line) => {
			doc.setFont("helvetica", "normal")
			doc.text(line, 15, y)
			y += 7
		})
	} else {
		addField("Nenhuma")
	}

	addFooter()

	// 🔹 Nota Fiscal anexada
	if (order.notaFiscalPath) {
		// agora salva path, não URL
		const base64Img = await fetchImageAsBase64(order.notaFiscalPath)
		doc.addPage()
		if (base64Img) {
			doc.text("Nota Fiscal Anexada:", 10, 20)
			doc.addImage(base64Img, "JPEG", 10, 30, 180, 160)
		} else {
			doc.text(
				`Erro ao carregar a nota fiscal: ${order.notaFiscalPath}`,
				10,
				100
			)
		}
	}

	// 🔹 Nome do arquivo
	const isHunter = order.tipoVeiculo.includes("Hunter")
	const isAliance = order.tipoVeiculo.includes("Aliance")

	const fileName = isHunter
		? `VEÍCULO-${order.carroNumero}-HUNTER.pdf`
		: isAliance
		? `VEÍCULO-${order.carroNumero}-ALIANCE.pdf`
		: `VEÍCULO-${order.carroNumero}.pdf`

	doc.save(fileName)
}
