import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@workspace/api-client-react";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product: Product, quantity = 1) => {
        set((state: CartStore) => {
          const existingItem = state.items.find((item: CartItem) => item.product.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item: CartItem) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },
      removeItem: (productId: number) => {
        set((state: CartStore) => ({
          items: state.items.filter((item: CartItem) => item.product.id !== productId),
        }));
      },
      updateQuantity: (productId: number, quantity: number) => {
        set((state: CartStore) => ({
          items: state.items.map((item: CartItem) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      get totalItems() {
        return get().items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
      },
      get totalPrice() {
        return get().items.reduce(
          (total: number, item: CartItem) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "idol-shop-cart",
    }
  )
);
