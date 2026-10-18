import { InteractiveDots } from "@/components/ui/interactive-dots"

/** The homepage hero's field: a static spread of orange and white dots on black. Every page hero shares it. */
export function HeroBackdrop() {
  return <InteractiveDots
    className="absolute inset-0 z-10"
    colors={["#ff5f1f", "#ff8a5c", "#ffb894", "#ffffff", "#ffc9b0"]}
    spacing={18}
    dotRadius={8}
    interactive={false}
  />
}
