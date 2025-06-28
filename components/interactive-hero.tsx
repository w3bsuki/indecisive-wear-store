"use client"

import { useState } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function InteractiveHero() {
  const [leftPanelSize, setLeftPanelSize] = useState(50)

  const getOpacity = (panel: "left" | "right") => {
    if (panel === "left") {
      return Math.max(0, (leftPanelSize - 25) / 25)
    } else {
      return Math.max(0, (75 - leftPanelSize) / 25)
    }
  }

  const getScale = (panel: "left" | "right") => {
    if (panel === "left") {
      return 0.8 + getOpacity("left") * 0.2
    } else {
      return 0.8 + getOpacity("right") * 0.2
    }
  }

  return (
    <section className="h-[calc(100vh-8.5rem)] md:h-[calc(100vh-5rem)] relative">
      <ResizablePanelGroup direction="horizontal" onLayout={(sizes) => setLeftPanelSize(sizes[0])}>
        <ResizablePanel defaultSize={50} minSize={25} maxSize={75}>
          <div className="w-full h-full bg-background flex flex-col justify-center items-center p-4 md:p-8">
            <div
              className="text-center space-y-4 md:space-y-8 transition-all duration-300"
              style={{ opacity: getOpacity("left"), transform: `scale(${getScale("left")})` }}
            >
              <Badge variant="outline" className="mb-4">THE ESSENTIALS</Badge>
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-tight text-foreground">
                CAN'T
                <br />
                DECIDE?
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">Minimalist essentials</p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 md:px-10 py-4 md:py-5 text-sm md:text-base font-mono font-medium">
                SHOP ESSENTIALS
              </Button>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={25} maxSize={75}>
          <div className="w-full h-full bg-primary flex flex-col justify-center items-center p-4 md:p-8">
            <div
              className="text-center space-y-4 md:space-y-8 transition-all duration-300"
              style={{ opacity: getOpacity("right"), transform: `scale(${getScale("right")})` }}
            >
              <Badge variant="secondary" className="mb-4">THE STATEMENT</Badge>
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-tight text-primary-foreground">
                CHOOSE
                <br />
                CHAOS
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">Urban streetwear</p>
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-6 md:px-10 py-4 md:py-5 text-sm md:text-base font-mono font-medium">
                SHOP STREETWEAR
              </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  )
}
