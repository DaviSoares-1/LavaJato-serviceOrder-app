import React, { useEffect, useState } from "react"
import useClientes from "../store/useClientes"
import ClienteModalForm from "./ClienteModalForm"

export default function ClientesPainel() {
	const { clientes, fetchClientes, deleteCliente } = useClientes()
	const [modalOpen, setModalOpen] = useState(false)
	const [clienteEditando, setClienteEditando] = useState(null)

	useEffect(() => {
		fetchClientes()
	}, [])

	const abrirWhatsapp = (contato) => {
		const numeroFormatado = contato.replace(/\D/g, "")
		window.open(`https://wa.me/55${numeroFormatado}`, "_blank")
	}

	return (
		<div className="p-4 text-white">

			{/* Cabeçalho */}
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-bold tracking-wide">
					👥 Painel de Clientes
				</h2>

				<button
					onClick={() => {
						setClienteEditando(null)
						setModalOpen(true)
					}}
					className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg shadow-md transition"
				>
					➕ Novo Cliente
				</button>
			</div>

			{/* Card da tabela */}
			<div className="bg-gray-800 rounded-lg shadow-md p-4 overflow-x-auto border border-gray-700">

				<table className="w-full text-left min-w-[900px]">
					<thead className="bg-gray-700">
						<tr>
							<th className="p-3 font-semibold">Nome</th>
							<th className="p-3 font-semibold">Contato</th>
							<th className="p-3 font-semibold">Modelo</th>
							<th className="p-3 font-semibold">Placa</th>
							<th className="p-3 font-semibold text-center">Serviços</th>
							<th className="p-3 font-semibold text-center">Ações</th>
						</tr>
					</thead>

					<tbody>
						{clientes.length === 0 ? (
							<tr>
								<td colSpan="6" className="p-4 text-center text-gray-400">
									Nenhum cliente registrado ainda.
								</td>
							</tr>
						) : (
							clientes.map((c) => (
								<tr
									key={c.id}
									className="border-t border-gray-700 hover:bg-gray-700/50 transition"
								>
									<td className="p-3">{c.nomeCliente}</td>
									<td className="p-3">{c.contatoCliente}</td>
									<td className="p-3">{c.modeloVeiculo}</td>
									<td className="p-3">{c.placaVeiculo}</td>
									<td className="p-3 text-center">{c.qntdServicos}</td>

									{/* Ações */}
									<td className="p-3 flex gap-2 justify-center">

										{/* WhatsApp */}
										<button
											onClick={() => abrirWhatsapp(c.contatoCliente)}
											className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow transition"
										>
											WhatsApp
										</button>

										{/* Editar */}
										<button
											onClick={() => {
												setClienteEditando(c)
												setModalOpen(true)
											}}
											className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow transition"
										>
											Editar
										</button>

										{/* Excluir */}
										<button
											onClick={() => {
												if (confirm(`Excluir o cliente ${c.nomeCliente}?`)) {
													deleteCliente(c.id)
												}
											}}
											className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow transition"
										>
											Excluir
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Modal */}
			{modalOpen && (
				<ClienteModalForm
					onClose={() => setModalOpen(false)}
					clienteEditando={clienteEditando}
				/>
			)}

			<a className="block mt-6 text-yellow-400 hover:text-yellow-300 underline" href="/">
				⬅ Voltar
			</a>
		</div>
	)
}
