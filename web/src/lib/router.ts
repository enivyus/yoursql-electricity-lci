import * as React from "react"

/** Tiny hash router: #/ , #/data/<id> , #/pipeline , #/sources */
export function useRoute() {
  const read = () => (window.location.hash.replace(/^#/, "") || "/").split("?")[0]
  const [route, setRoute] = React.useState(read)
  React.useEffect(() => {
    const on = () => {
      const next = read()
      setRoute((prev) => {
        if (prev !== next) window.scrollTo({ top: 0 })
        return next
      })
    }
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return route
}

export const href = (path: string) => `#${path}`
