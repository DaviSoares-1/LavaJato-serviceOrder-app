import { supabase } from "../supabaseClient"

// 🔹 Sanitiza string (permitindo letras, números, . _ -)
const sanitize = (str) => str.replace(/[^a-zA-Z0-9._-]/g, "")

export const uploadNotaFiscal = async (file, orderId) => {
	if (!(file instanceof File)) {
		console.error("Arquivo inválido para upload:", file)
		return null
	}

	try {
		// 🔹 Garantir extensão e tipo
		const fileExt = file.name.split(".").pop()?.toLowerCase() || "dat"
		const timestamp = Date.now()
		const safeOrderId = sanitize(String(orderId || timestamp))
		const safeName = sanitize(file.name.split(".")[0])

		// 🔹 Caminho dentro do bucket (sem "notas-fiscais/")
		const filePath = `notas/${safeOrderId}-${safeName}-${timestamp}.${fileExt}`

		// for debugging
		// console.log(">> Upload Nota Fiscal", {
		//   originalName: file.name,
		//   safeName,
		//   type: file.type,
		//   size: file.size,
		//   filePath
		// })

		// 🔹 Upload no Supabase Storage
		const { error: uploadError } = await supabase.storage
			.from("notas-fiscais")
			.upload(filePath, file, {
				cacheControl: "3600",
				upsert: true,
				contentType: file.type || "application/octet-stream" // default seguro
			})

		if (uploadError) {
			console.error("Erro ao enviar nota fiscal:", uploadError.message)
			return null
		}

		// 🔹 Gerar URL pública
		const { data: publicUrlData } = supabase.storage
			.from("notas-fiscais")
			.getPublicUrl(filePath)

		return {
			url: publicUrlData.publicUrl,
			name: file.name,
			path: filePath
		}
	} catch (err) {
		console.error("Erro inesperado ao enviar nota fiscal:", err)
		return null
	}
}

export const deleteNotaFiscal = async (filePath) => {
	if (!filePath) return true // nada a remover

	try {
		const { error } = await supabase.storage
			.from("notas-fiscais")
			.remove([filePath])

		if (error) {
			console.error("Erro ao deletar nota fiscal:", error.message)
			return false
		}
		return true
	} catch (err) {
		console.error("Erro inesperado ao deletar nota fiscal:", err)
		return false
	}
}
