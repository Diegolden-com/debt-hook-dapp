"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Loader2, CheckCircle, AlertCircle, Users, Zap } from "lucide-react"

type AVSStatus = "none" | "submitted" | "pending_match" | "matched" | "executed" | "failed"
type BatchStatus = "collecting" | "matching" | "executing" | "completed" | "failed"

interface BatchStatusIndicatorProps {
  avsStatus: AVSStatus
  batchStatus?: BatchStatus
  matchedRate?: number
  requestedRate?: number
  isFullyMatched?: boolean
  batchNumber?: number
}

export function BatchStatusIndicator({
  avsStatus,
  batchStatus,
  matchedRate,
  requestedRate,
  isFullyMatched,
  batchNumber,
}: BatchStatusIndicatorProps) {
  // Return null for direct orders
  if (avsStatus === "none") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Instant
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Direct order - executes immediately when matched</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const getStatusConfig = () => {
    switch (avsStatus) {
      case "submitted":
        return {
          label: "Submitted",
          icon: Clock,
          variant: "outline" as const,
          tooltip: "Order submitted to AVS for batch matching",
          className: "border-blue-500 text-blue-600",
        }
      case "pending_match":
        return {
          label: batchStatus === "matching" ? "Matching..." : "In Batch",
          icon: batchStatus === "matching" ? Loader2 : Users,
          variant: "outline" as const,
          tooltip: `Order in batch #${batchNumber || "?"} - ${batchStatus || "pending"}`,
          className: "border-yellow-500 text-yellow-600",
          animate: batchStatus === "matching",
        }
      case "matched":
        return {
          label: isFullyMatched ? "Fully Matched" : "Partially Matched",
          icon: CheckCircle,
          variant: "outline" as const,
          tooltip: matchedRate 
            ? `Matched at ${matchedRate}% (requested ${requestedRate}%)`
            : "Order matched and awaiting execution",
          className: "border-green-500 text-green-600",
        }
      case "executed":
        return {
          label: "Executed",
          icon: CheckCircle,
          variant: "default" as const,
          tooltip: "Order executed on-chain",
          className: "bg-green-600",
        }
      case "failed":
        return {
          label: "Failed",
          icon: AlertCircle,
          variant: "destructive" as const,
          tooltip: "Batch execution failed - order can be resubmitted",
          className: "",
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant} 
            className={`text-xs ${config.className} ${config.animate ? "animate-pulse" : ""}`}
          >
            <Icon className={`w-3 h-3 mr-1 ${config.animate ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>{config.tooltip}</p>
            {matchedRate && requestedRate && matchedRate !== requestedRate && (
              <p className="text-xs">
                Rate improvement: {((matchedRate - requestedRate) / requestedRate * 100).toFixed(1)}%
              </p>
            )}
            {batchNumber && (
              <p className="text-xs text-muted-foreground">
                Batch #{batchNumber}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compound component for showing batch summary
interface BatchSummaryProps {
  totalOrders: number
  pendingMatches: number
  currentBatchNumber?: number
  nextExecutionTime?: Date
}

export function BatchSummary({ 
  totalOrders, 
  pendingMatches, 
  currentBatchNumber,
  nextExecutionTime 
}: BatchSummaryProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>{pendingMatches} orders in batch</span>
      </div>
      {currentBatchNumber && (
        <div className="flex items-center gap-1">
          <span>Batch #{currentBatchNumber}</span>
        </div>
      )}
      {nextExecutionTime && (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Executes in {getTimeUntil(nextExecutionTime)}</span>
        </div>
      )}
    </div>
  )
}

function getTimeUntil(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  
  if (diff < 0) return "soon"
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  return `${minutes}m`
}