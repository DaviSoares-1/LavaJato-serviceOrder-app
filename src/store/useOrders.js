import {create} from 'zustand'
import { persist } from 'zustand/middleware'

const useOrders = create(persist(
  (set) => ({
    orders: [],
    addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
    updateOrder: (updated) =>
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === updated.id ? updated : order
        ),
      })),
    deleteOrder: (id) =>
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== id),
      })),
  }),
  {
    name: 'orders-storage',
    getStorage: () => localStorage,
  }
))

export default useOrders