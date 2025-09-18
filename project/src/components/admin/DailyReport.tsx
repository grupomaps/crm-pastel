import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { FileText, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SalesReport {
  totalSales: number
  totalRevenue: number
  paymentMethods: {
    cash: number
    debit: number
    credit: number
    qrcode: number
  }
  productsSold: {
    name: string
    quantity: number
    revenue: number
  }[]
}

export function DailyReport() {
  const [loading, setLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportData, setReportData] = useState<SalesReport | null>(null)

  const generateReport = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Buscar vendas do dia
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            subtotal,
            products (name)
          )
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)

      if (salesData) {
        const totalSales = salesData.length
        const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0)

        // Agrupar por método de pagamento
        const paymentMethods = {
          cash: salesData.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.total_amount, 0),
          debit: salesData.filter(s => s.payment_method === 'debit').reduce((sum, s) => sum + s.total_amount, 0),
          credit: salesData.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + s.total_amount, 0),
          qrcode: salesData.filter(s => s.payment_method === 'qrcode').reduce((sum, s) => sum + s.total_amount, 0),
        }

        // Agrupar produtos vendidos
        const productsMap = new Map()
        salesData.forEach(sale => {
          sale.sale_items?.forEach((item: { quantity: number; unit_price: number; subtotal: number; products?: { name: string } }) => {
            const productName = item.products?.name || 'Produto não encontrado'
            if (productsMap.has(productName)) {
              const existing = productsMap.get(productName)
              productsMap.set(productName, {
                name: productName,
                quantity: existing.quantity + item.quantity,
                revenue: existing.revenue + item.subtotal
              })
            } else {
              productsMap.set(productName, {
                name: productName,
                quantity: item.quantity,
                revenue: item.subtotal
              })
            }
          })
        })

        const productsSold = Array.from(productsMap.values())

        setReportData({
          totalSales,
          totalRevenue,
          paymentMethods,
          productsSold
        })
        setShowReport(true)
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const sendWhatsAppReport = async () => {
    if (!reportData) return

    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR })
    
    let message = `📊 *RELATÓRIO DIÁRIO - ${today}*\n\n`
    message += `🛒 *Total de Vendas:* ${reportData.totalSales}\n`
    message += `💰 *Faturamento Total:* R$ ${reportData.totalRevenue.toFixed(2)}\n\n`
    
    message += `💳 *FORMAS DE PAGAMENTO:*\n`
    message += `💵 Dinheiro: R$ ${reportData.paymentMethods.cash.toFixed(2)}\n`
    message += `🏧 Cartão Débito: R$ ${reportData.paymentMethods.debit.toFixed(2)}\n`
    message += `💳 Cartão Crédito: R$ ${reportData.paymentMethods.credit.toFixed(2)}\n`
    message += `📱 QR Code/PIX: R$ ${reportData.paymentMethods.qrcode.toFixed(2)}\n\n`
    
    if (reportData.productsSold.length > 0) {
      message += `📦 *PRODUTOS MAIS VENDIDOS:*\n`
      reportData.productsSold
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .forEach(product => {
          message += `• ${product.name}: ${product.quantity}x (R$ ${product.revenue.toFixed(2)})\n`
        })
    }

    // Simular envio para WhatsApp (em produção, use a API do WhatsApp Business)
    const whatsappUrl = `https://api.whatsapp.com/send?phone=5511932911121&text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      <button
        onClick={generateReport}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
      >
        <FileText className="w-4 h-4" />
        <span>{loading ? 'Gerando...' : 'Relatório Diário'}</span>
      </button>

      {showReport && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Relatório do Dia {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setShowReport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reportData.totalSales}</div>
                  <div className="text-sm text-gray-600">Total de Vendas</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {reportData.totalRevenue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Faturamento</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Formas de Pagamento</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">💵 Dinheiro:</span>
                    <span className="font-medium">R$ {reportData.paymentMethods.cash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🏧 Cartão Débito:</span>
                    <span className="font-medium">R$ {reportData.paymentMethods.debit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">💳 Cartão Crédito:</span>
                    <span className="font-medium">R$ {reportData.paymentMethods.credit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">📱 QR Code/PIX:</span>
                    <span className="font-medium">R$ {reportData.paymentMethods.qrcode.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {reportData.productsSold.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Top Produtos</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {reportData.productsSold
                      .sort((a, b) => b.quantity - a.quantity)
                      .slice(0, 5)
                      .map((product, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{product.name}:</span>
                          <span className="font-medium">
                            {product.quantity}x (R$ {product.revenue.toFixed(2)})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReport(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  onClick={sendWhatsAppReport}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}