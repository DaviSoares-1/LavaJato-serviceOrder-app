import { supabase } from "../supabaseClient"

export const fetchImageAsBase64 = async (path) => {
  try {
    if (!path) return null

    const { data, error } = await supabase.storage
      .from("notas-fiscais")
      .download(path)

    if (error) {
      console.error("Erro ao baixar nota fiscal:", error)
      return null
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result) // retorna base64
      reader.onerror = reject
      reader.readAsDataURL(data) // "data" é Blob
    })
  } catch (err) {
    console.error("Erro ao converter imagem:", err)
    return null
  }
}
