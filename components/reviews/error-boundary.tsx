"use client"

import React, { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ReviewsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Reviews component error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-bold font-mono">Something went wrong</h3>
            <p className="text-sm text-black/60 text-center max-w-md">
              We encountered an error while loading the reviews. Please try refreshing the page.
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
              className="font-mono"
            >
              Try Again
            </Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}