/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
} from "lucide-react";
import { DailyReport } from "../admin/DailyReport";
import { toast, ToastContainer } from "react-toastify";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  image_base64: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function AttendantDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "debit" | "credit" | "qrcode"
  >("cash");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [pendingProduct, setPendingProduct] = useState(null);
  const [cashReceived, setCashReceived] = useState<number>(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .gt("stock_quantity", 0)
        .order("name");

      if (data) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductClick = (product: any) => {
    if (cart.length === 0 && !clientName) {
      setPendingProduct(product);
      setShowClientModal(true);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmClient = () => {
    if (!clientName.trim() || !pendingProduct) return;
    addToCart(pendingProduct);
    setPendingProduct(null);
    setShowClientModal(false);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      const product = products.find((p) => p.id === productId);
      if (product && newQuantity <= product.stock_quantity) {
        setCart(
          cart.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    try {
      // Criar venda
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            total_amount: getTotalAmount(),
            payment_method: paymentMethod,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar itens da venda
      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Atualizar estoque
      for (const item of cart) {
        const newStock = item.product.stock_quantity - item.quantity;
        await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product.id);
      }

      // Limpar carrinho e recarregar produtos
      setCart([]);
      fetchProducts();
      toast.success("Venda registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao processar venda:", error);
      alert("Erro ao processar venda");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando produtos...</div>
      </div>
    );
  }
  const printCart = () => {
    if (cart.length === 0) return alert("Carrinho vazio!");

    const cartHtml = `
    <html>
      <head>
        <title>Resumo do Carrinho</title>
        <style>
          body { font-family: sans-serif; width: 300px; margin: 20px; }
          hr { border: 1px solid #ccc; }
          .item { margin-bottom: 12px; }
          .item p { margin: 2px 0; }
          .total { font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        ${clientName ? `<p><strong>Cliente:</strong> ${clientName}</p>` : ""}
        <hr />
        ${cart
          .map(
            (item) => `
            <div class="item">
              <p><strong>${item.product.name}</strong></p>
              <p>Preço unitário: R$ ${item.product.price.toFixed(2)}</p>
              <p>Quantidade: ${item.quantity}</p>
              <p>Subtotal: R$ ${(item.product.price * item.quantity).toFixed(
                2
              )}</p>
            </div>
          `
          )
          .join("")}
        <hr />
        <p class="total">Total: R$ ${cart
          .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
          .toFixed(2)}</p>
      </body>
    </html>
  `;

    const printWindow = window.open("", "PRINT", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(cartHtml);
    printWindow.document.close();
    printWindow.focus();

    // Dá um pequeno delay antes de fechar para garantir que a impressão termine
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      {/* Lista de Produtos */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="relative flex items-center space-x-3">
            <div className="w-full">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-full">
              <DailyReport />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-[500px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="">
                  <div className="flex justify-center">
                    <img
                      src={`${product.image_base64}`}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold text-green-600">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Estoque: {product.stock_quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrinho */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Carrinho</h3>
              <span className="bg-blue-100 text-blue-600 text-sm px-2 py-1 rounded-full">
                {cart.length}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Carrinho vazio</p>
            ) : (
              <>
                {clientName && (
                  <p className="text-gray-700 font-medium text-center mb-2">
                    Cliente: <span className="font-semibold">{clientName}</span>
                  </p>
                )}

                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between space-x-3 p-2 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-600">
                        R$ {item.product.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-green-600">
                  R$ {getTotalAmount().toFixed(2)}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as "cash" | "debit" | "credit" | "qrcode"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">💵 Dinheiro</option>
                    <option value="debit">🏧 Cartão Débito</option>
                    <option value="credit">💳 Cartão Crédito</option>
                    <option value="qrcode">📱 QR Code/PIX</option>
                  </select>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor recebido (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={cashReceived}
                      onChange={(e) =>
                        setCashReceived(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Troco: R$ {(cashReceived - getTotalAmount()).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={printCart}
                disabled
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                Imprimir Carrinho
              </button>
              <button
                onClick={processSale}
                disabled={processing}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Receipt className="w-4 h-4" />
                <span>{processing ? "Processando..." : "Finalizar Venda"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {showClientModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-semibold mb-4">
              Digite o nome do cliente
            </h2>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              placeholder="Nome do cliente"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowClientModal(false)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClient}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
