import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function Login() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		const checkSession = async () => {
			const { data } = await supabase.auth.getSession()
			if (data?.session) navigate("/orderform")
		}
		checkSession()
	}, [navigate])

	const handleLogin = async (e) => {
		e.preventDefault()
		setError("")

		if (!email || !password) {
			setError("Preencha todos os campos.")
			return
		}

		setLoading(true)
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		})
		setLoading(false)

		if (error) {
			setError("Email ou senha incorretos.")
			return
		}

		navigate("/OrderForm")
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-yellow-700">
			{/* CONTAINER PRINCIPAL */}
			<div className="bg-yellow-500/90 backdrop-blur-md shadow-lg p-10 rounded-2xl w-full max-w-sm border border-black/20">
				{/* LOGO */}
				<div className="flex justify-center mb-4">
					<div className="w-54 h-54 rounded-full bg-white shadow-md overflow-hidden border border-black/20 flex items-center justify-center">
						{/* Substituir o src quando colocar a logo correta */}
						<img
							src="/logo.jpeg"
							alt="Logo do Sistema"
							className="w-full h-full object-cover"
						/>
					</div>
				</div>

				{/* TÍTULO */}
				<h1 className="text-2xl font-extrabold text-center mb-6 text-black drop-shadow-sm">
					Acesso ao Sistema
				</h1>

				{/* FORM */}
				<form onSubmit={handleLogin} className="space-y-4">
					{/* EMAIL */}
					<div>
						<label
							htmlFor="email"
							className="block text-black font-semibold mb-1 cursor-pointer"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full bg-white border border-black/20 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
							placeholder="exemplo@dominio.com"
						/>
					</div>

					{/* SENHA */}
					<div>
						<label
							htmlFor="senha"
							className="block text-black font-semibold mb-1 cursor-pointer"
						>
							Senha
						</label>
						<input
							id="senha"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full bg-white border border-black/20 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
							placeholder="••••••••"
						/>
					</div>

					{error && <p className="text-red-600 font-medium text-sm">{error}</p>}

					{/* BOTÃO */}
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-black text-white py-2 rounded-md font-semibold hover:bg-neutral-900 transition disabled:opacity-60 cursor-pointer shadow-md"
					>
						{loading ? "Entrando..." : "Entrar no Sistema"}
					</button>
				</form>
			</div>
		</div>
	)
}
