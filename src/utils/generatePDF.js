import jsPDF from "jspdf"

export const generatePDF = async (order) => {
	const doc = new jsPDF()
	let y = 10

	// formatação da Data e Hora;
	const date = order.dataHora.replace(" - ", " / ").replace("T", " ").split("")
	const year = []
	const month = []
	const day = []
	const newFormatDate = []
	for (let i = 0; i < date.length; i++) {
		if (i < 4) {
			year.push(date[i])
		} else if (i > 4 && i < 7) {
			month.push(date[i])
		} else if (i > 7 && i < 10) {
			day.push(date[i])
		}
	}

	// formatação do Valor Total e Caixinha
	const totalPagoFormatado = new Intl.NumberFormat("pr-BR", { style: "currency", currency: "BRL" }).format(
		+order.total
	)
	const caixinhaFormatado = new Intl.NumberFormat("pr-BR", { style: "currency", currency: "BRL" }).format(
		+order.caixinha
	)

	const addLine = (text) => {
		doc.text(text, 10, y)
		y += 10
	}

	addLine("Ordem de Serviço JJ LAVA-JATO LTDA")
	addLine("----------------------------")

	addLine(`Data e Hora: ${newFormatDate.concat(day, "/", month, "/", year).join("")} - ${date.slice(11).join("")}`)
	addLine(`Responsável: ${order.responsavel.toUpperCase()}`)
	addLine(`Carro N°: ${order.carroNumero}`)

	addLine(`Modelo do Carro: ${order.modeloCarro.toUpperCase().trim()}`)
	addLine(`Placa do Carro: ${order.placaCarro.toUpperCase().trim()}`)

	addLine("Serviços Solicitados:")
	order.servicos.forEach((s) => addLine(`- ${s}`))

	addLine(`Total a Pagar: ${totalPagoFormatado}`)
	addLine(`Caixinha: ${caixinhaFormatado}`)

	addLine(`Forma de Pagamento: ${order.formaPagamento}`)
	if (order.formaPagamento === "Outros") {
		addLine(`Descrição do Pagamento: ${order.descricaoOutros.trim()}`)
	}

	addLine("Observações:")
	addLine(order.observacoes.trim() || "Nenhuma")

	addLine(`Status: ${order.status}`)
	addLine("----------------------------")

  // Adiciona a imagem da nota fiscal se existir
  if (order.notaFiscalUrl) {
    const img = new Image()
    img.src = order.notaFiscalUrl
    await new Promise((resolve) => {
      img.onload = () => {
        const pageHeight = doc.internal.pageSize.height
        doc.addPage()
        doc.addImage(img, 'JPEG', 10, 10, 180, 160)
        resolve()
      }
    })
  }

	doc.save(`ordem-servico-${order.id}.pdf`)
}
