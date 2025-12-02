import React from "react"

// feedback para quando uma numeração já esteja definida

function Toast({ message, type }) {
	if (!message) return null

	let bgColor = "bg-gray-500"
	let icon = "ℹ️"

	switch (type) {
		case "success":
			bgColor = "bg-green-600"
			icon = "✔️"
			break
		case "edit":
			bgColor = "bg-orange-500"
			icon = "✏️"
			break
		case "delete":
			bgColor = "bg-red-600"
			icon = "🗑️"
			break
		case "restore":
			bgColor = "bg-blue-600" // Fundo azul para restauração
			icon = "♻️"
			break
		case "permanent-delete":
			bgColor = "bg-red-800" // Vermelho escuro para exclusão definitiva
			icon = "❌"
			break
		case "error":
			bgColor = "bg-red-500"
			icon = "❗"
			break
		case "reopen":
			bgColor = "bg-purple-600"
			icon = "🔄"
			break
		default:
			break
	}

	return (
		<div className="fixed top-2 left-10 z-50">
			<div
				className={`text-2xl flex items-center gap-2 text-white px-6 py-3 rounded-lg shadow-md font-sans font-semibold ${bgColor}`}
			>
				<span>{icon}</span>
				<span>{message}</span>
			</div>
		</div>
	)
}

export default Toast
