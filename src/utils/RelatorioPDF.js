import jsPDF from "jspdf"
import { fetchImageAsBase64 } from "./fetchImageAsBase64"

export const generateRelatorioDiarioPDF = async ({
	totalServicosPrestados,
	valoresRecebidos,
	valoresCantina,
	valoresOutros,
	gastos,
	notaFiscalPath
}) => {
	const doc = new jsPDF()
	let y = 10

	// 🔹 Utilitário de formatação BRL
	const formatBRL = (valor) =>
		new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
			minimumFractionDigits: 2
		}).format(Number(valor) || 0)

	// 🔹 Cabeçalho formal
	const addHeader = () => {
		doc.setFontSize(24)
		doc.setFont("helvetica", "bold")
		const headerY = 10
		doc.text("RELATÓRIO DIÁRIO", 105, headerY, null, null, "center")

		y += 7
		doc.setFontSize(12)
		doc.setFont("helvetica", "normal")
		doc.text("CNPJ: 58.736.525/0001-70", 105, y, null, null, "center")

		y += 7
		doc.text(
			"Endereço: Açaituba, 26 - Jardim Carioca, Rio de Janeiro/RJ, 21931-520",
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

		// Caixa com a data (alinhada na linha do título)
		const dataAtual = new Date()
		const formattedDate = dataAtual.toLocaleDateString("pt-BR")
		doc.setFont("helvetica", "bold")
		doc.setFontSize(14)
		doc.rect(160, headerY - 8, 40, 10)
		doc.text(`Dia ${formattedDate}`, 162, headerY)

		y += 15
	}

	// 🔹 Rodapé
	const addFooter = () => {
		doc.setFontSize(10)
		doc.setFont("helvetica", "italic")
		doc.text(
			"Relatório gerado automaticamente. Não possui valor fiscal.",
			105,
			290,
			null,
			null,
			"center"
		)
	}

	// 🔹 Seções
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
		doc.text(value || "", 70, y)
		y += 8
	}

	// 🔹 Montagem do PDF
	addHeader()

	// Quantidade de serviços
	addSection("Quantidade de Serviços")
	addField("Total de serviços prestados:", String(` ${totalServicosPrestados}`))

	// Valores recebidos
	addSection("Valores Recebidos")
	addField("Dinheiro:", formatBRL(valoresRecebidos.Dinheiro))
	addField("Crédito:", formatBRL(valoresRecebidos.Crédito))
	addField("Débito:", formatBRL(valoresRecebidos.Débito))
	addField("Código QR Pix:", formatBRL(valoresRecebidos["Código QR Pix"]))
	addField("Caixinha:", formatBRL(valoresRecebidos.Caixinha))
	addField("Faturamento Total:", formatBRL(valoresRecebidos.total))

	// Vendas da cantina
	addSection("Vendas da Cantina")
	addField("Dinheiro:", formatBRL(valoresCantina.Dinheiro))
	addField("Crédito:", formatBRL(valoresCantina.Crédito))
	addField("Débito:", formatBRL(valoresCantina.Débito))
	addField("Código QR Pix:", formatBRL(valoresCantina["Código QR Pix"]))
	addField("Faturamento Total:", formatBRL(valoresCantina.total))

	// 🔹 Pagamentos Alternativos (Outros)
	if (valoresOutros?.detalhesRecebidos?.length > 0) {
		addSection("Pagamentos Pendentes/Alternativos")
		valoresOutros.detalhesRecebidos.forEach((d) => {
			addField(`• ${formatBRL(d.valor)} (${d.descricao})`)
		})
		addField(`• Total: ${formatBRL(valoresOutros.recebidos)}`)
	}

	// Gastos
	addSection("Gastos Diários")
	if (gastos.length > 0) {
		gastos.forEach((g) => {
			addField(g.descricaoGasto, formatBRL(g.valorGasto))
		})
		const totalGastos = gastos.reduce((acc, g) => acc + g.valorGasto, 0)
		addField("Total de Gastos:", formatBRL(totalGastos))
	} else {
		addField("Nenhum gasto registrado", "-")
	}

	addFooter()

	// 🔹 Nota Fiscal anexada (mesma lógica do generatePDF.js)
	if (notaFiscalPath) {
		const base64Img = await fetchImageAsBase64(notaFiscalPath)
		doc.addPage()
		if (base64Img) {
			doc.text("Nota Fiscal Anexada:", 10, 20)
			doc.addImage(base64Img, "JPEG", 10, 30, 180, 160)
		} else {
			doc.text(`Erro ao carregar a nota fiscal: ${notaFiscalPath}`, 10, 100)
		}
	}

	// 🔹 Nome do arquivo
	const fileName = `RELATORIO-DIARIO-${
		new Date().toISOString().split("T")[0]
	}.pdf`
	doc.save(fileName)
}
