import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	useNavigate
} from "react-router-dom"
import React, { useState, useEffect, useRef } from "react"
import { supabase } from "./supabaseClient"
import Login from "./components/Login"
import ClientesPainel from "./components/ClientesPainel"
import OrderForm from "./components/OrderForm"
import OrderListSection from "./components/OrderListSection"
import TrashListSection from "./components/TrashListSection"
import RelatorioDiario from "./components/RelatorioDiario"
import Toast from "./components/Toast"
import useOrders from "./store/useOrders"
import useGastos from "./store/useGastos"

function ProtectedRoute({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let active = true

		const getUser = async () => {
			const { data } = await supabase.auth.getUser()
			if (active) {
				setUser(data?.user ?? null)
				setLoading(false)
			}
		}

		getUser()

		const { data: subscription } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				if (active) {
					setUser(session?.user ?? null)
					setLoading(false)
				}
			}
		)

		return () => {
			active = false
			subscription.subscription.unsubscribe()
		}
	}, [])

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-600 text-white text-xl">
				Carregando...
			</div>
		)
	}

	if (!user) return <Navigate to="/" replace />
	return children
}

function Sistema() {
	const {
		orders,
		deletedOrders,
		fetchOrders,
		softDeleteOrder,
		restoreOrder,
		permanentlyDeleteOrder
	} = useOrders()

	const [editingOrder, setEditingOrder] = useState(null)
	const formRef = useRef(null)
	const relatorioRef = useRef(null)
	const ordensRef = useRef(null)
	const lixeiraRef = useRef(null)
	const [showToast, setShowToast] = useState(false)
	const [toastMessage, setToastMessage] = useState("")
	const [toastType, setToastType] = useState("success")
	const navigate = useNavigate()

	// ✅ Garante que fetchOrders é executado apenas uma vez
	useEffect(() => {
		fetchOrders()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// 🔄 Realtime Orders + Gastos Diarios
	useEffect(() => {
		fetchOrders() // Garantir que carrega ao abrir

		// --- Realtime ORDERS ---
		const ordersChannel = supabase
			.channel("realtime-orders")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "orders_storage" },
				(payload) => {
					console.log("📥 New order realtime", payload.new)
					fetchOrders() // Alternativa: addOrderLocal(payload.new)
				}
			)
			.on(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "orders_storage" },
				(payload) => {
					console.log("✏️ Updated order realtime", payload.new)
					fetchOrders() // Melhor abordagem até concluirmos updateOrderLocal
				}
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "orders_storage" },
				(payload) => {
					console.log("🗑️ Deleted order realtime", payload.old.id)
					fetchOrders() // Alternativa: deleteOrderLocal(payload.old.id)
				}
			)
			.subscribe()

		// --- Realtime Gastos Diarios ---
		const gastosChannel = supabase
			.channel("realtime-gastos")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "gastos_diarios" },
				({ new: novo }) => {
					console.log("➕ Realtime INSERT gasto", novo)
					fetchOrders() 
				}
			)
			.on(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "gastos_diarios" },
				({ new: atualizado }) => {
					console.log("♻️ Realtime UPDATE gasto", atualizado)
					fetchOrders() 
				}
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "gastos_diarios" },
				({ old }) => {
					console.log("🗑️ Realtime DELETE gasto", old.id)
					fetchOrders() 
				}
			)
			.subscribe()

		return () => {
			supabase.removeChannel(ordersChannel)
			supabase.removeChannel(gastosChannel)
		}
	}, [])

	const handleEdit = (order) => {
		setEditingOrder(order)
		formRef.current.scrollIntoView({
			behavior: "smooth",
			block: "start"
		})
	}

	const triggerToast = (msg, type = "success") => {
		setToastMessage(msg)
		setToastType(type)
		setShowToast(true)
		setTimeout(() => setShowToast(false), 3000)
	}

	const handleLogout = async () => {
		await supabase.auth.signOut()
		navigate("/")
	}

	return (
		<div className="bg-gray-900 min-h-screen flex flex-col md:flex-row custom-scrollbar">
			<div className="flex-1 overflow-auto p-4">
				{/* Cabeçalho fixo */}
				<header className="sticky top-0 z-40 bg-gray-900 p-3 border-b border-gray-700 flex justify-between items-center">
					<h1 className="text-xl md:text-3xl font-extrabold text-white tracking-wide">
						📑 JJ LAVA-JATO
					</h1>

					<div className="flex items-center gap-3">
						<a
							href="/clientes"
							className="text-yellow-400 font-semibold text-sm md:text-base"
						>
							Gerenciar Clientes
						</a>

						<button
							onClick={handleLogout}
							className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm md:text-base"
						>
							Sair
						</button>
					</div>
				</header>

				{/* Navegação - DESKTOP (hidden no mobile) */}
				<div className="hidden md:flex justify-end gap-2 flex-wrap mb-2 mt-4">
					<button
						onClick={() =>
							relatorioRef.current?.scrollIntoView({
								behavior: "smooth",
								block: "start"
							})
						}
						className="bg-yellow-500 px-4 py-2 rounded cursor-pointer"
					>
						📊 Relatório
					</button>

					<button
						onClick={() =>
							ordensRef.current?.scrollIntoView({
								behavior: "smooth",
								block: "start"
							})
						}
						className="bg-yellow-500 px-4 py-2 rounded cursor-pointer"
					>
						📋 Ordens
					</button>

					<button
						onClick={() =>
							lixeiraRef.current?.scrollIntoView({
								behavior: "smooth",
								block: "start"
							})
						}
						className="bg-yellow-500 px-4 py-2 rounded cursor-pointer"
					>
						🗑️ Lixeira
					</button>
				</div>

				{/* Menu inferior - MOBILE (hidden no desktop) */}
				<nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 flex justify-around md:hidden z-50">
					<button
						onClick={() =>
							formRef.current?.scrollIntoView({ behavior: "smooth" })
						}
						className="text-yellow-400"
					>
						📄 Ficha
					</button>

					<button
						onClick={() =>
							relatorioRef.current?.scrollIntoView({ behavior: "smooth" })
						}
						className="text-yellow-400"
					>
						📊 Relatório
					</button>

					<button
						onClick={() =>
							ordensRef.current?.scrollIntoView({ behavior: "smooth" })
						}
						className="text-yellow-400"
					>
						📋 Ordens
					</button>

					<button
						onClick={() =>
							lixeiraRef.current?.scrollIntoView({ behavior: "smooth" })
						}
						className="text-yellow-400"
					>
						🗑️ Lixeira
					</button>
				</nav>

				{showToast && <Toast message={toastMessage} type={toastType} />}

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20">
					{/* Formulário */}
					<div className="bg-gray-800 rounded-lg shadow-md overflow-y-scroll scrollbar-hidden max-h-[90vh]">
						<OrderForm
							ref={formRef}
							editingOrder={editingOrder}
							setEditingOrder={setEditingOrder}
						/>
					</div>

					{/* Coluna lateral direita */}
					<div className="flex flex-col gap-4 max-h-[90vh] overflow-y-scroll scrollbar-hidden">
						{/* Relatório */}
						<div
							ref={relatorioRef}
							className="bg-gray-800 p-4 rounded-lg shadow-md"
						>
							<RelatorioDiario />
						</div>

						{/* Ordens ativas */}
						<div
							ref={ordensRef}
							className="bg-gray-800 p-4 rounded-lg shadow-md"
						>
							<h2 className="text-2xl font-bold text-white text-center mb-4">
								🏷️ Ordens Geradas:
							</h2>
							<OrderListSection
								orders={orders}
								onEdit={handleEdit}
								// ✅ Correção: passa o id, não o objeto inteiro
								onDelete={(order) => {
									softDeleteOrder(order.id)
									triggerToast(
										`A ordem número: (${
											order.carroNumero
										}) - Carro: ${order.modeloCarro.toUpperCase()} foi Excluída.`,
										"delete"
									)
								}}
							/>
						</div>

						{/* Lixeira */}
						<div
							ref={lixeiraRef}
							className="bg-gray-800 p-4 rounded-lg shadow-md"
						>
							<h2 className="text-2xl font-bold text-white text-center mb-4">
								🗑️ Lixeira:
							</h2>
							<TrashListSection
								deletedOrders={deletedOrders}
								// ✅ Correções das referências
								onRestore={(order) => {
									restoreOrder(order.id)
									triggerToast(
										`A ordem número: (${
											order.carroNumero
										}) - Carro: ${order.modeloCarro.toUpperCase()} foi Restaurada.`,
										"restore"
									)
								}}
								onPermanentDelete={(order) => {
									permanentlyDeleteOrder(order.id)
									triggerToast(
										`A ordem número: (${
											order.carroNumero
										}) - Carro: ${order.modeloCarro.toUpperCase()} foi Apagada.`,
										"permanent-delete"
									)
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function App() {
	// ✅ Configuração automática para ambiente local e produção
	const isProd = import.meta.env.MODE === "production"
	const basename = isProd ? "/LavaJato-serviceOrder-app" : "/"

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route
					path="/orderform"
					element={
						<ProtectedRoute>
							<Sistema />
						</ProtectedRoute>
					}
				/>
				<Route path="/clientes" element={<ClientesPainel />} />
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</BrowserRouter>
	)
}
