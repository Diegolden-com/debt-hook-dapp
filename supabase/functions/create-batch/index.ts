import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Minimum orders required to create a batch
const MIN_ORDERS_FOR_BATCH = 5
const BATCH_COLLECTION_WINDOW_MINUTES = 5

serve(async (req) => {
  try {
    // This function can be called periodically to check if we should create a new batch
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Check if there's already an active batch
    const { data: activeBatch } = await supabase
      .from('batches')
      .select('*')
      .eq('status', 'collecting')
      .single()

    if (activeBatch) {
      // Check if the batch has been collecting for too long
      const collectionTime = Date.now() - new Date(activeBatch.submission_timestamp).getTime()
      const maxCollectionTime = BATCH_COLLECTION_WINDOW_MINUTES * 60 * 1000

      if (collectionTime > maxCollectionTime) {
        // Check if we have enough orders
        const orderCount = await getEligibleOrderCount()
        
        if (orderCount >= MIN_ORDERS_FOR_BATCH) {
          // Transition batch to matching
          await transitionBatchToMatching(activeBatch.id)
          
          // Create a new batch for collecting
          await createNewBatch()
          
          return new Response(
            JSON.stringify({ 
              message: 'Batch transitioned to matching and new batch created',
              batchId: activeBatch.id 
            }),
            { headers: { 'Content-Type': 'application/json' } }
          )
        } else {
          // Not enough orders, extend the collection window
          return new Response(
            JSON.stringify({ 
              message: 'Not enough orders yet',
              currentOrders: orderCount,
              requiredOrders: MIN_ORDERS_FOR_BATCH 
            }),
            { headers: { 'Content-Type': 'application/json' } }
          )
        }
      } else {
        return new Response(
          JSON.stringify({ 
            message: 'Active batch still collecting',
            batchId: activeBatch.id,
            timeRemaining: BATCH_COLLECTION_WINDOW_MINUTES * 60 - (collectionTime / 1000)
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // No active batch, check if we should create one
      const orderCount = await getEligibleOrderCount()
      
      if (orderCount >= MIN_ORDERS_FOR_BATCH) {
        const newBatchId = await createNewBatch()
        
        return new Response(
          JSON.stringify({ 
            message: 'New batch created',
            batchId: newBatchId,
            eligibleOrders: orderCount 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      } else {
        return new Response(
          JSON.stringify({ 
            message: 'Not enough orders to create batch',
            currentOrders: orderCount,
            requiredOrders: MIN_ORDERS_FOR_BATCH 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  } catch (error) {
    console.error('Error in create-batch function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function getEligibleOrderCount(): Promise<number> {
  // Count lender orders eligible for batching
  const { count: lenderCount } = await supabase
    .from('signed_orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('avs_status', 'submitted')
    .is('current_batch_id', null)

  // Count borrower orders eligible for batching
  const { count: borrowerCount } = await supabase
    .from('borrower_orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('avs_status', 'submitted')
    .is('current_batch_id', null)

  return (lenderCount || 0) + (borrowerCount || 0)
}

async function createNewBatch(): Promise<string> {
  // Get the next batch number
  const { data: batchNumberData } = await supabase
    .rpc('get_next_batch_number')

  const batchNumber = batchNumberData || 1

  // Create new batch
  const { data: newBatch, error } = await supabase
    .from('batches')
    .insert({
      batch_number: batchNumber,
      status: 'collecting',
      submission_timestamp: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Assign eligible orders to the batch
  await assignOrdersToBatch(newBatch.id)

  return newBatch.id
}

async function assignOrdersToBatch(batchId: string) {
  // Update lender orders
  await supabase
    .from('signed_orders')
    .update({ 
      current_batch_id: batchId,
      avs_status: 'pending_match' 
    })
    .eq('status', 'active')
    .eq('avs_status', 'submitted')
    .is('current_batch_id', null)

  // Update borrower orders
  await supabase
    .from('borrower_orders')
    .update({ 
      current_batch_id: batchId,
      avs_status: 'pending_match' 
    })
    .eq('status', 'active')
    .eq('avs_status', 'submitted')
    .is('current_batch_id', null)
}

async function transitionBatchToMatching(batchId: string) {
  const { error } = await supabase
    .from('batches')
    .update({
      status: 'matching',
      matching_start_timestamp: new Date().toISOString()
    })
    .eq('id', batchId)

  if (error) throw error

  // Trigger matching process (this would call the AVS operator)
  // In production, this would send a request to the EigenLayer operator
  console.log(`Batch ${batchId} transitioned to matching status`)
}