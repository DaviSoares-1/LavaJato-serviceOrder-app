import React from "react"
import useOrders from "../store/useOrders"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const OrderList = ({ onEdit }) => {
	const { orders, removeOrder } = useOrders()

	const generatePDF = async (order) => {
		const element = document.createElement("div")
		element.style.padding = "20px"
		element.style.background = "#fff"
		element.style.width = "600px"

		element.innerHTML = `
      <h2>Ordem de Serviço</h2>
      <p><strong>Data e Hora:</strong> ${order.dataHora}</p>
      <p><strong>Responsável:</strong> ${order.responsavel}</p>
      <p><strong>Carro nº:</strong> ${order.carroNumero}</p>
      <p><strong>Modelo:</strong> ${order.modeloCarro}</p>
      <p><strong>Placa:</strong> ${order.placaCarro}</p>
      <p><strong>Serviços:</strong> ${order.servicos.join(", ")}</p>
      <p><strong>Total:</strong> R$ ${order.total}</p>
      <p><strong>Caixinha:</strong> R$ ${order.caixinha}</p>
      <p><strong>Pagamento:</strong> ${order.formaPagamento}</p>
      ${
				order.formaPagamento === "Outros"
					? `<p><strong>Descrição:</strong> ${order.descricaoOutros}</p>`
					: ""
			}
      <p><strong>Observações:</strong> ${order.observacoes}</p>
      <p><strong>Status:</strong> ${order.status}</p>
    `

		document.body.appendChild(element)
		const canvas = await html2canvas(element)
		const imgData = canvas.toDataURL("image/png")
		const pdf = new jsPDF()
		const imgProps = pdf.getImageProperties(imgData)
		const pdfWidth = pdf.internal.pageSize.getWidth()
		const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

		pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
		pdf.save(`ordem_${order.id}.pdf`)
		document.body.removeChild(element)
	}

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<h2 className="text-xl font-bold text-white mb-4">Ordens de Serviço</h2>
			{orders.length === 0 ? (
				<p className="text-gray-400">Nenhuma ordem cadastrada ainda.</p>
			) : (
				<ul className="space-y-4">
					{orders.map((order) => (
						<li
							key={order.id}
							className="bg-gray-800 text-white p-4 rounded shadow"
						>
							<div className="flex justify-between items-start">
								<div>
									<p>
										<strong>{order.responsavel}</strong> — {order.modeloCarro} (
										{order.placaCarro})
									</p>
									<p>Status: {order.status}</p>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => onEdit(order)}
										className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
									>
										Editar
									</button>
									<button
										onClick={() => removeOrder(order.id)}
										className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
									>
										Excluir
									</button>
									<button
										onClick={() => generatePDF(order)}
										className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded"
									>
										PDF
									</button>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

export default OrderList
