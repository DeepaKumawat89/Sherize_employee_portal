import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'

export function useDocument(reference, initialValue = null) {
  const [data, setData] = useState(initialValue)
  const [loading, setLoading] = useState(Boolean(reference))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!reference) {
      setData(initialValue)
      setLoading(false)
      return undefined
    }
    setLoading(true)
    return onSnapshot(reference, (snapshot) => {
      setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : initialValue)
      setError(null)
      setLoading(false)
    }, (nextError) => {
      setError(nextError)
      setLoading(false)
    })
  }, [reference, initialValue])

  return { data, loading, error }
}

export function useCollection(reference) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(Boolean(reference))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!reference) {
      setData([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    return onSnapshot(reference, (snapshot) => {
      setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      setError(null)
      setLoading(false)
    }, (nextError) => {
      setError(nextError)
      setLoading(false)
    })
  }, [reference])

  return { data, loading, error }
}
