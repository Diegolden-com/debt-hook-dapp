'use client';

import { useState } from 'react';
import { useRealtimeLoans } from '@/lib/hooks/useRealtimeLoans';
import { usePrivyWallet } from '@/hooks/use-privy-wallet';
import { formatEther, formatUnits } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RealtimeDashboard() {
  const { address } = usePrivyWallet();
  const [activeTab, setActiveTab] = useState<'lender' | 'borrower'>('borrower');

  // Real-time loans where user is borrower
  const { 
    loans: borrowerLoans, 
    loading: borrowerLoading, 
    refresh: refreshBorrower,
    isSubscribed: borrowerSubscribed 
  } = useRealtimeLoans({ borrower: address || undefined });

  // Real-time loans where user is lender
  const { 
    loans: lenderLoans, 
    loading: lenderLoading, 
    refresh: refreshLender,
    isSubscribed: lenderSubscribed 
  } = useRealtimeLoans({ lender: address || undefined });

  const calculateStats = (loans: any[]) => {
    const activeLoans = loans.filter(l => l.status === 'active');
    const totalValue = activeLoans.reduce((sum, loan) => sum + Number(loan.loan_amount), 0);
    const totalCollateral = activeLoans.reduce((sum, loan) => sum + Number(loan.collateral_amount), 0);
    
    return {
      activeCount: activeLoans.length,
      totalValue: totalValue / 1e6, // Convert to USDC
      totalCollateral: totalCollateral / 1e18, // Convert to ETH
      repaidCount: loans.filter(l => l.status === 'repaid').length,
      liquidatedCount: loans.filter(l => l.status === 'liquidated').length,
    };
  };

  const borrowerStats = calculateStats(borrowerLoans);
  const lenderStats = calculateStats(lenderLoans);

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      active: 'default',
      repaid: 'secondary',
      liquidated: 'destructive',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any || 'default'}>
        {status}
      </Badge>
    );
  };

  const ConnectionIndicator = ({ isConnected }: { isConnected: boolean }) => (
    <div className="flex items-center gap-2 text-sm">
      <div className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
      )} />
      <span className="text-muted-foreground">
        {isConnected ? "Live" : "Connecting..."}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Real-time Dashboard</h2>
        <ConnectionIndicator 
          isConnected={activeTab === 'borrower' ? borrowerSubscribed : lenderSubscribed} 
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="borrower">As Borrower</TabsTrigger>
          <TabsTrigger value="lender">As Lender</TabsTrigger>
        </TabsList>

        <TabsContent value="borrower" className="space-y-4">
          {/* Borrower Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{borrowerStats.activeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${borrowerStats.totalValue.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{borrowerStats.totalCollateral.toFixed(4)} ETH</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repaid/Liquidated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {borrowerStats.repaidCount}/{borrowerStats.liquidatedCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Borrower Loans List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Loans</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshBorrower}
                  disabled={borrowerLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", borrowerLoading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {borrowerLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : borrowerLoans.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No loans found</div>
              ) : (
                <div className="space-y-4">
                  {borrowerLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Loan #{loan.loan_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatUnits(BigInt(loan.loan_amount), 6)} USDC • 
                          {formatEther(BigInt(loan.collateral_amount))} ETH collateral
                        </div>
                      </div>
                      <StatusBadge status={loan.status || 'active'} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lender" className="space-y-4">
          {/* Lender Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lenderStats.activeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${lenderStats.totalValue.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collateral Held</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lenderStats.totalCollateral.toFixed(4)} ETH</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repaid/Liquidated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lenderStats.repaidCount}/{lenderStats.liquidatedCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lender Loans List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Loans You&apos;ve Funded</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshLender}
                  disabled={lenderLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", lenderLoading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lenderLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : lenderLoans.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No loans found</div>
              ) : (
                <div className="space-y-4">
                  {lenderLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Loan #{loan.loan_id}</div>
                        <div className="text-sm text-muted-foreground">
                          Borrower: {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatUnits(BigInt(loan.loan_amount), 6)} USDC • 
                          {formatEther(BigInt(loan.collateral_amount))} ETH collateral
                        </div>
                      </div>
                      <StatusBadge status={loan.status || 'active'} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}