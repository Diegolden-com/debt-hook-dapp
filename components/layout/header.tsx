"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { usePrivy } from "@privy-io/react-auth"

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { authenticated, user } = usePrivy()
  const isVerified = authenticated && user?.hasAcceptedTerms

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">DebtHook</span>
        </Link>

        {/* Desktop Navigation - Hidden on small screens */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/market"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/market" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Market
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-8 w-8 px-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Verification Status - Hidden on small screens */}
          {authenticated && (
            <Badge variant={isVerified ? "default" : "secondary"} className="hidden sm:flex">
              <Shield className="h-3 w-3 mr-1" />
              {isVerified ? "Verified" : "Unverified"}
            </Badge>
          )}

          {/* Connect Wallet */}
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
