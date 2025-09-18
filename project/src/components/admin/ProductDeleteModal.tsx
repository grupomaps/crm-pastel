import { useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase"; 

type Product = {
  id: string;
  name: string;
};

export function ProductDeleteModal({
  product,
  onClose,
  onDeleteSuccess,
}: {
  product: Product | null;
  onClose: () => void;
  onDeleteSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      toast.success(`Produto "${product.name}" excluído com sucesso!`);
      onDeleteSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao excluir o produto "${product.name}"!`);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4">Confirmação</h2>
        <p className="mb-6">Tem certeza que deseja excluir o produto "{product.name}"?</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
