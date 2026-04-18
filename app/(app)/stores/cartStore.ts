import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
    productId: number;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number;
    size?: string;
    color?: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    totalCount: () => number;
    totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => set((s) => {
                const exists = s.items.find(i => i.productId === item.productId);
                if (exists) {
                    return { items: s.items.map(i =>
                            i.productId === item.productId
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        )};
                }
                return { items: [...s.items, item] };
            }),
            removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.productId !== id) })),
            updateQuantity: (id, qty) => set((s) => ({
                items: s.items.map(i => i.productId === id ? { ...i, quantity: qty } : i)
            })),
            clearCart: () => set({ items: [] }),
            totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }),
        { name: 'gg-cart' }
    )
);