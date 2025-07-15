import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transaction_id')
    const userId = searchParams.get('user_id')

    if (!transactionId && !userId) {
      return NextResponse.json(
        { error: 'Se requiere transaction_id o user_id' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('payment_transactions')
      .select('*')

    if (transactionId) {
      query = query.eq('id', transactionId)
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false })
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { error: 'Error obteniendo transacciones' },
        { status: 500 }
      )
    }

    if (transactionId) {
      // Retornar una sola transacción
      const transaction = transactions?.[0]
      if (!transaction) {
        return NextResponse.json(
          { error: 'Transacción no encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          payment_method: transaction.payment_method,
          credits_amount: transaction.credits_amount,
          usd_amount: transaction.usd_amount,
          currency: transaction.currency,
          created_at: transaction.created_at,
          external_id: transaction.external_id
        }
      })
    } else {
      // Retornar múltiples transacciones del usuario
      return NextResponse.json({
        success: true,
        transactions: transactions?.map(transaction => ({
          id: transaction.id,
          status: transaction.status,
          payment_method: transaction.payment_method,
          credits_amount: transaction.credits_amount,
          usd_amount: transaction.usd_amount,
          currency: transaction.currency,
          created_at: transaction.created_at,
          external_id: transaction.external_id
        })) || []
      })
    }

  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}