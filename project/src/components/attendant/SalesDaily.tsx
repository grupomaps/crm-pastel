import { SaleItem } from "../../types/database";

interface SalesDailyProps {
  sales: SaleItem[];
}

const SalesDaily = ({ sales }: SalesDailyProps) => {
  return (
    <div className="mx-auto my-6 p-4 bg-white rounded-2xl shadow-lg">
      <h2 className="text-center text-2xl font-bold text-gray-800 mb-4">
        📊 Vendas do Dia
      </h2>

      {sales.length === 0 ? (
        <p className="mt-4 text-center text-red-500 font-medium">
          Nenhuma venda registrada.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
                <th className="border p-3 text-left">Produto</th>
                <th className="border p-3 text-left">Cliente</th>
                <th className="border p-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="border p-3">{sale.product_name}</td>
                  <td className="border p-3">{sale.client_name}</td>
                  <td className="border p-3 text-right">
                    {sale.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesDaily;
