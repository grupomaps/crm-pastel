import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { ProductForm } from "./ProductForm";
import { toast, ToastContainer } from "react-toastify";
import { ProductDeleteModal } from "./ProductDeleteModal";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string;
  barcode: string | null;
  image_base64: string | null;
}

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  dailyRevenue: number;
  lowStockProducts: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    dailyRevenue: 0,
    lowStockProducts: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Buscar produtos
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (productsData) {
        setProducts(productsData);

        // Calcular estatísticas
        const totalProducts = productsData.length;
        const lowStockProducts = productsData.filter(
          (p) => p.stock_quantity < 5
        ).length;

        // Buscar vendas do dia
        const today = new Date().toISOString().split("T")[0];
        const { data: salesData } = await supabase
          .from("sales")
          .select("total_amount")
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`);

        const dailyRevenue =
          salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
        const totalSales = salesData?.length || 0;

        setStats({
          totalProducts,
          totalSales,
          dailyRevenue,
          lowStockProducts,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    fetchDashboardData();
    toast.success(`Produto salvo com sucesso!`);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Painel Administrativo
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total de Produtos
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalProducts}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalSales}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Faturamento Hoje
              </p>
              <p className="text-3xl font-bold text-gray-900">
                R$ {stats.dailyRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.lowStockProducts}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Gestão de Produtos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Imagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={`${product.image_base64}`}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${
                        product.stock_quantity < 5
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showDeleteModal && (
        <ProductDeleteModal
          product={selectedProduct}
          onClose={() => setShowDeleteModal(false)}
          onDeleteSuccess={fetchDashboardData}
        />
      )}
      {/* Formulário de Produto */}
      {(showProductForm || editingProduct) && (
        <ProductForm
          product={editingProduct}
          onSave={handleProductSaved}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
      <ToastContainer />
    </div>
  );
}
