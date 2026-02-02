import { useState, useEffect } from 'react'

interface ProjectAidsCountOptions {
  territoire?: string
  keywords?: string
  enabled?: boolean
}

export function useProjectAidsCount({ territoire, keywords, enabled = true }: ProjectAidsCountOptions) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Ne pas lancer la recherche si désactivé ou si aucun critère
    if (!enabled || (!territoire && !keywords)) {
      setCount(null)
      return
    }

    const fetchCount = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (territoire) params.append('targeted_audiences', territoire)
        if (keywords) params.append('text', keywords)

        const response = await fetch(`/api/aides-territoires/search?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche')
        }

        const data = await response.json()
        setCount(data.count || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du comptage')
        setCount(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [territoire, keywords, enabled])

  return { count, loading, error }
}
