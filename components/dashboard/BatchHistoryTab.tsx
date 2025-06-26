'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { BatchStatusIndicator } from '@/components/batch-status-indicator'
import { Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { formatUnits } from 'viem'

interface BatchHistoryData {
  id: string
  batch_number: number
  status: 'collecting' | 'matching' | 'executing' | 'completed' | 'failed'
  submission_timestamp: string
  completion_timestamp: string | null
  matched_pairs: number | null
  total_matched_volume: number | null
  average_matched_rate: number | null
  total_orders: number | null
  lender_orders: number | null
  borrower_orders: number | null
  fully_matched_orders: number | null
  match_success_rate: number | null
  matching_duration_seconds: number | null
  execution_duration_seconds: number | null
  total_duration_seconds: number | null
}

interface UserBatchOrder {
  order_id: string | null
  batch_number: number | null
  batch_status: string | null
  loan_amount: number | null
  interest_rate_bips: number | null
  matched_amount: number | null
  matched_rate: number | null
  is_fully_matched: boolean | null
  order_type: string | null
  lender?: string | null
  borrower?: string | null
  collateral_amount?: number | null
  maturity_timestamp?: number | null
  avs_status?: string | null
  current_batch_id?: string | null
  batch_submission_time?: string | null
}

interface UserBatchStats {
  user_address: string | null
  user_type: string
  total_batches_participated: number
  total_orders_submitted: number
  fully_matched_orders: number | null
  total_matched_volume: number | null
  average_matched_rate: number | null
  match_success_rate: number | null
  average_matching_score?: number | null
}

export function BatchHistoryTab() {
  const { address } = usePrivyWallet()
  const [activeTab, setActiveTab] = useState('overview')
  const [batchHistory, setBatchHistory] = useState<BatchHistoryData[]>([])
  const [userOrders, setUserOrders] = useState<UserBatchOrder[]>([])
  const [userStats, setUserStats] = useState<UserBatchStats | null>(null)
  const [currentBatch, setCurrentBatch] = useState<BatchHistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (address) {
      fetchBatchData()
      // Set up real-time subscription
      const subscription = supabase
        .channel('batch-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'batches'
        }, () => {
          fetchBatchData()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [address])

  const fetchBatchData = async () => {
    if (!address) return

    try {
      setIsLoading(true)

      // Fetch batch history
      const { data: historyData } = await supabase
        .from('batch_execution_history')
        .select('*')
        .order('submission_timestamp', { ascending: false })
        .limit(10)

      // Fetch current batch
      const { data: currentBatchData } = await supabase
        .from('batch_status_summary')
        .select('*')
        .eq('status', 'collecting')
        .single()

      // Fetch user's pending orders
      const { data: userOrdersData } = await supabase
        .from('user_pending_batch_orders')
        .select('*')
        .or(`lender.eq.${address},borrower.eq.${address}`)
        .order('batch_number', { ascending: false })

      // Fetch user statistics
      const { data: statsData } = await supabase
        .from('user_batch_statistics')
        .select('*')
        .eq('user_address', address)
        .single()

      // Map the data to match our interface types
      if (historyData) {
        setBatchHistory(historyData.map((item: any) => ({
          id: item.id || '',
          batch_number: item.batch_number || 0,
          status: item.status || 'collecting',
          submission_timestamp: item.submission_timestamp || '',
          completion_timestamp: item.completion_timestamp,
          matched_pairs: item.matched_pairs,
          total_matched_volume: item.total_matched_volume,
          average_matched_rate: item.average_matched_rate,
          total_orders: item.total_orders,
          lender_orders: item.lender_orders,
          borrower_orders: item.borrower_orders,
          fully_matched_orders: item.fully_matched_orders,
          match_success_rate: item.match_success_rate,
          matching_duration_seconds: item.matching_duration_seconds,
          execution_duration_seconds: item.execution_duration_seconds,
          total_duration_seconds: item.total_duration_seconds
        })))
      }
      
      if (currentBatchData) {
        const current = currentBatchData as any
        setCurrentBatch({
          id: current.id || '',
          batch_number: current.batch_number || 0,
          status: current.status || 'collecting',
          submission_timestamp: current.submission_timestamp || '',
          completion_timestamp: current.completion_timestamp || null,
          matched_pairs: current.matched_pairs || null,
          total_matched_volume: current.actual_matched_volume || current.total_matched_volume || null,
          average_matched_rate: current.average_matched_rate || null,
          total_orders: current.total_orders || null,
          lender_orders: current.total_lender_orders || null,
          borrower_orders: current.total_borrower_orders || null,
          fully_matched_orders: current.fully_matched_orders || null,
          match_success_rate: 0,
          matching_duration_seconds: null,
          execution_duration_seconds: null,
          total_duration_seconds: null
        })
      }
      
      if (userOrdersData) {
        setUserOrders(userOrdersData.map((order: any) => ({
          order_id: order.order_id || '',
          batch_number: order.batch_number || 0,
          batch_status: order.batch_status || '',
          loan_amount: order.loan_amount || 0,
          interest_rate_bips: order.interest_rate_bips || 0,
          matched_amount: order.matched_amount,
          matched_rate: order.matched_rate,
          is_fully_matched: order.is_fully_matched || false,
          order_type: order.order_type || 'lender',
          lender: order.lender,
          borrower: order.borrower,
          collateral_amount: order.collateral_amount,
          maturity_timestamp: order.maturity_timestamp,
          avs_status: order.avs_status,
          current_batch_id: order.current_batch_id,
          batch_submission_time: order.batch_submission_time ? new Date(order.batch_submission_time).toISOString() : null
        })))
      }
      
      if (statsData) {
        const stats = statsData as any
        setUserStats({
          user_address: stats.user_address || address || '',
          user_type: stats.user_type || 'lender',
          total_batches_participated: stats.total_batches_participated || stats.total_batches || 0,
          total_orders_submitted: stats.total_orders_submitted || stats.total_orders || 0,
          fully_matched_orders: stats.fully_matched_orders || 0,
          total_matched_volume: stats.total_matched_volume || stats.total_volume || 0,
          average_matched_rate: stats.average_matched_rate || 0,
          match_success_rate: stats.match_success_rate || 0,
          average_matching_score: stats.average_matching_score
        })
      }
    } catch (error) {
      console.error('Error fetching batch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBatchStatusColor = (status: string) => {
    switch (status) {
      case 'collecting': return 'bg-blue-500'
      case 'matching': return 'bg-yellow-500'
      case 'executing': return 'bg-orange-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  return (
    <div className="space-y-6">
      {/* Current Batch Status */}
      {currentBatch && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Current Batch #{currentBatch.batch_number}
              </CardTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getBatchStatusColor(currentBatch.status)}`} />
                {currentBatch.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{currentBatch.total_orders || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lender Orders</p>
                <p className="text-2xl font-bold">{currentBatch.lender_orders || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Borrower Orders</p>
                <p className="text-2xl font-bold">{currentBatch.borrower_orders || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className="text-2xl font-bold">~4m</p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Batch Progress</span>
                <span>Matching starts at 10 orders</span>
              </div>
              <Progress value={((currentBatch.total_orders || 0) / 10) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="my-orders">My Orders</TabsTrigger>
          <TabsTrigger value="history">Batch History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {userStats ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Batch Statistics</CardTitle>
                  <CardDescription>Performance across all batch matching rounds</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Batches Participated</p>
                      <p className="text-2xl font-bold">{userStats.total_batches_participated}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Orders Submitted</p>
                      <p className="text-2xl font-bold">{userStats.total_orders_submitted}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Match Success Rate</p>
                      <p className="text-2xl font-bold">{((userStats.match_success_rate || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Volume</p>
                      <p className="text-2xl font-bold">${(userStats.total_matched_volume || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Average Matched Rate</span>
                    </div>
                    <p className="text-3xl font-bold">{((userStats.average_matched_rate || 0) / 100).toFixed(2)}%</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Across {userStats.fully_matched_orders} fully matched orders
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Batch History</p>
                <p className="text-sm text-muted-foreground">You haven't participated in any batch matching rounds yet</p>
                <Button className="mt-4" onClick={() => window.location.href = '/market'}>
                  Create Your First Batch Order
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Orders Tab */}
        <TabsContent value="my-orders">
          <Card>
            <CardHeader>
              <CardTitle>Your Batch Orders</CardTitle>
              <CardDescription>Orders submitted for batch matching</CardDescription>
            </CardHeader>
            <CardContent>
              {userOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Matched</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userOrders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell>{order.batch_number || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={order.order_type === 'lender' ? 'default' : 'secondary'}>
                            {order.order_type}
                          </Badge>
                        </TableCell>
                        <TableCell>${(order.loan_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>{((order.interest_rate_bips || 0) / 100).toFixed(2)}%</TableCell>
                        <TableCell>
                          {order.matched_amount 
                            ? `$${order.matched_amount.toLocaleString()} @ ${(order.matched_rate! / 100).toFixed(2)}%`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <BatchStatusIndicator
                            avsStatus={order.is_fully_matched ? 'matched' : 'pending_match'}
                            batchStatus={order.batch_status as any}
                            isFullyMatched={order.is_fully_matched || false}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No batch orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Batch Execution History</CardTitle>
              <CardDescription>Recent batch matching rounds</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Avg Rate</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchHistory.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>#{batch.batch_number}</TableCell>
                      <TableCell>
                        <Badge variant={batch.status === 'completed' ? 'default' : 'destructive'}>
                          {batch.status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {batch.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{batch.total_orders}</TableCell>
                      <TableCell>{batch.matched_pairs} pairs</TableCell>
                      <TableCell>${(batch.total_matched_volume || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {batch.average_matched_rate 
                          ? `${batch.average_matched_rate.toFixed(2)}%`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{formatDuration(batch.total_duration_seconds)}</TableCell>
                      <TableCell>
                        {batch.completion_timestamp 
                          ? formatDistanceToNow(new Date(batch.completion_timestamp), { addSuffix: true })
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}