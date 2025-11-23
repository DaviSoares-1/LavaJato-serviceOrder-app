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
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-600">
			<div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
				<h1 className="text-2xl font-bold text-center mb-6 text-purple-700">
					Acesso ao Sistema
				</h1>

				<form onSubmit={handleLogin} className="space-y-4">
					<div>
						<label
							className="block text-gray-700 text-sm font-medium mb-1 cursor-pointer"
							htmlFor="email"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
							placeholder="exemplo@dominio.com"
						/>
					</div>

					<div>
						<label
							className="block text-gray-700 text-sm font-medium mb-1 cursor-pointer"
							htmlFor="senha"
						>
							Senha
						</label>
						<input
							id="senha"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
							placeholder="••••••••"
						/>
					</div>

					{error && <p className="text-red-500 text-sm">{error}</p>}

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer"
					>
						{loading ? "Entrando..." : "Entrar"}
					</button>
				</form>
			</div>
		</div>
	)
}
