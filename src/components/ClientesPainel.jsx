import React, { useEffect } from "react"
import useClientes from "../store/useClientes"

export default function ClientesPainel() {
	const { clientes, fetchClientes } = useClientes()

	useEffect(() => {
		fetchClientes()
	}, [])

	const abrirWhatsapp = (contato) => {
		const numeroFormatado = contato.replace(/\D/g, "")
		window.open(`https://wa.me/55${numeroFormatado}`, "_blank")
	}

	return (
		<div className="p-4">
			<h2 className="text-xl font-bold mb-4">Painel de Clientes</h2>

			<table className="w-full border border-gray-300">
				<thead className="bg-gray-200">
					<tr>
						<th className="p-2">Nome</th>
						<th className="p-2">Contato</th>
						<th className="p-2">Modelo</th>
						<th className="p-2">Placa</th>
						<th className="p-2">Qtde Serviços</th>
						<th className="p-2">Ações</th>
					</tr>
				</thead>
				<tbody>
					{clientes.map((c) => (
						<tr key={c.id} className="border-t">
							<td className="p-2">{c.nomeCliente}</td>
							<td className="p-2">{c.contatoCliente}</td>
							<td className="p-2">{c.modeloVeiculo}</td>
							<td className="p-2">{c.placaVeiculo}</td>
							<td className="p-2 text-center">{c.qntdServicos}</td>
							<td className="p-2 flex gap-2 justify-center">
								<button
									className="bg-blue-500 text-white px-2 py-1 rounded"
									onClick={() => abrirWhatsapp(c.contatoCliente)}
								>
									WhatsApp
								</button>
								<button className="bg-orange-500 text-white px-2 py-1 rounded">
									Editar
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<a className="block mt-4 text-blue-600 underline" href="/">
				Voltar
			</a>
		</div>
	)
}
