import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface BatchEvent {
  type: 'batch_created' | 'batch_matched' | 'batch_executed' | 'batch_failed'
  batchId: string
  data?: any
}

serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Parse the event
    const event: BatchEvent = await req.json()
    console.log('Processing batch event:', event)

    switch (event.type) {
      case 'batch_created':
        await handleBatchCreated(event.batchId)
        break

      case 'batch_matched':
        await handleBatchMatched(event.batchId, event.data)
        break

      case 'batch_executed':
        await handleBatchExecuted(event.batchId, event.data)
        break

      case 'batch_failed':
        await handleBatchFailed(event.batchId, event.data)
        break

      default:
        throw new Error(`Unknown event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event processed successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing batch event:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function handleBatchCreated(batchId: string) {
  // Update batch status to 'collecting'
  const { error } = await supabase
    .from('batches')
    .update({ 
      status: 'collecting',
      submission_timestamp: new Date().toISOString()
    })
    .eq('id', batchId)

  if (error) throw error

  console.log(`Batch ${batchId} created and collecting orders`)
}

async function handleBatchMatched(batchId: string, matchingData: any) {
  // Start a transaction to update batch and orders atomically
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .update({
      status: 'executing',
      matching_end_timestamp: new Date().toISOString(),
      matched_pairs: matchingData.matchedPairs,
      total_matched_volume: matchingData.totalVolume,
      average_matched_rate: matchingData.averageRate
    })
    .eq('id', batchId)
    .select()
    .single()

  if (batchError) throw batchError

  // Update matched orders
  if (matchingData.matches && Array.isArray(matchingData.matches)) {
    for (const match of matchingData.matches) {
      // Update lender order
      if (match.lenderOrderId) {
        await supabase
          .from('signed_orders')
          .update({
            avs_status: 'matched',
            matched_rate: match.rate,
            matched_amount: match.amount,
            is_fully_matched: match.isFullyMatched
          })
          .eq('id', match.lenderOrderId)
      }

      // Update borrower order
      if (match.borrowerOrderId) {
        await supabase
          .from('borrower_orders')
          .update({
            avs_status: 'matched',
            matched_rate: match.rate,
            matched_amount: match.amount
          })
          .eq('id', match.borrowerOrderId)
      }

      // Create batch_orders entries
      await supabase
        .from('batch_orders')
        .insert([
          {
            batch_id: batchId,
            order_id: match.lenderOrderId,
            order_type: 'lender',
            matched_with_order_id: match.borrowerOrderId,
            matched_amount: match.amount,
            matched_rate: match.rate,
            is_fully_matched: match.isFullyMatched,
            matching_score: match.score
          },
          {
            batch_id: batchId,
            order_id: match.borrowerOrderId,
            order_type: 'borrower',
            matched_with_order_id: match.lenderOrderId,
            matched_amount: match.amount,
            matched_rate: match.rate,
            is_fully_matched: match.isFullyMatched,
            matching_score: match.score
          }
        ])
    }
  }

  console.log(`Batch ${batchId} matched with ${matchingData.matchedPairs} pairs`)
}

async function handleBatchExecuted(batchId: string, executionData: any) {
  // Update batch status to completed
  const { error } = await supabase
    .from('batches')
    .update({
      status: 'completed',
      completion_timestamp: new Date().toISOString(),
      execution_tx_hash: executionData.txHash
    })
    .eq('id', batchId)

  if (error) throw error

  // Update all matched orders to executed
  await supabase
    .from('signed_orders')
    .update({ avs_status: 'executed' })
    .eq('current_batch_id', batchId)
    .eq('avs_status', 'matched')

  await supabase
    .from('borrower_orders')
    .update({ avs_status: 'executed', status: 'executed' })
    .eq('current_batch_id', batchId)
    .eq('avs_status', 'matched')

  // Create loan entries for executed matches
  if (executionData.loans && Array.isArray(executionData.loans)) {
    const loanEntries = executionData.loans.map((loan: any) => ({
      loan_id: loan.loanId,
      lender: loan.lender,
      borrower: loan.borrower,
      principal_amount: loan.principalAmount,
      collateral_amount: loan.collateralAmount,
      interest_rate_bips: loan.interestRateBips,
      maturity_timestamp: loan.maturityTimestamp,
      creation_timestamp: new Date().toISOString(),
      creation_tx_hash: executionData.txHash,
      status: 'active'
    }))

    await supabase
      .from('loans')
      .insert(loanEntries)
  }

  console.log(`Batch ${batchId} executed successfully with tx: ${executionData.txHash}`)
}

async function handleBatchFailed(batchId: string, failureData: any) {
  // Update batch status to failed
  const { error } = await supabase
    .from('batches')
    .update({
      status: 'failed',
      completion_timestamp: new Date().toISOString(),
      failure_reason: failureData.reason
    })
    .eq('id', batchId)

  if (error) throw error

  // Reset all orders in the batch
  await supabase
    .from('signed_orders')
    .update({
      avs_status: 'failed',
      current_batch_id: null,
      matched_rate: null,
      matched_amount: null,
      is_fully_matched: false
    })
    .eq('current_batch_id', batchId)

  await supabase
    .from('borrower_orders')
    .update({
      avs_status: 'failed',
      current_batch_id: null,
      matched_rate: null,
      matched_amount: null
    })
    .eq('current_batch_id', batchId)

  console.log(`Batch ${batchId} failed: ${failureData.reason}`)
}