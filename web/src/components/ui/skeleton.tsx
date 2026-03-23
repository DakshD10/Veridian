import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-[#1F1F23] rounded", className)}
      style={{
        backgroundImage: "linear-gradient(90deg, #1F1F23 0%, #27272A 50%, #1F1F23 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite"
      }}
      {...props}
    />
  )
}

export { Skeleton }
