import React, { useState } from "react"
import OrderForm from "./components/OrderForm"
import useOrders from "./store/useOrders"
import { generatePDF } from "./utils/generatePDF"

function App() {
	const { orders, deleteOrder } = useOrders()
	const [editingOrder, setEditingOrder] = useState(null)

	return (
		<div className="min-h-screen p-4 space-y-6">
			<h1 className="text-3xl font-bold text-center text-white m-0">
				Sistema de Ordens de Serviço
			</h1>
			<OrderForm
				editingOrder={editingOrder}
				setEditingOrder={setEditingOrder}
			/>
			<div className="flex gap-2 flex-wrap justify-center">
				{orders.map((order) => (
					<div key={order.id} className="bg-yellow-500 p-4 rounded shadow max-w-max">
						<p>
							<strong>Responsável:</strong> {order.responsavel.toUpperCase()}
						</p>
						<p>
							<strong>Status:</strong> {order.status}
						</p>
						<p>
							<strong>Ordem n°:</strong> {order.carroNumero}
						</p>
						<div className="flex gap-2 mt-2">
							<button
								onClick={() => setEditingOrder(order)}
								className="bg-yellow-400 px-2 py-1 rounded cursor-pointer"
							>
								Editar
							</button>
							<button
								onClick={() => deleteOrder(order.id)}
								className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
							>
								Excluir
							</button>
							{
								<button
									onClick={() => generatePDF(order)}
									className="bg-green-600 text-white px-2 py-1 rounded cursor-pointer"
								>
									Baixar PDF
								</button>
							}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default App
