import { createContext, useContext, useState, useRef, useCallback } from 'react'

export const RecordingContext = createContext(null)

export function RecordingProvider({ children }) {
  const [isRecording, setIsRecording] = useState(false)
  const [pendingSteps, setPendingSteps] = useState(null)
  const stepsRef = useRef([])
  const lastTimeRef = useRef(null)

  const start = useCallback(() => {
    stepsRef.current = []
    lastTimeRef.current = Date.now()
    setPendingSteps(null)
    setIsRecording(true)
  }, [])

  const record = useCallback((step) => {
    const now = Date.now()
    const gap = lastTimeRef.current !== null ? (now - lastTimeRef.current) / 1000 : 0
    if (gap >= 0.5) {
      stepsRef.current.push({ type: 'sleep', seconds: String(Math.round(gap * 10) / 10) })
    }
    lastTimeRef.current = Date.now()
    stepsRef.current.push(step)
  }, [])

  const stop = useCallback(() => {
    setIsRecording(false)
    const steps = [...stepsRef.current]
    setPendingSteps(steps)
    return steps
  }, [])

  const consumePending = useCallback(() => {
    const steps = pendingSteps
    setPendingSteps(null)
    return steps
  }, [pendingSteps])

  return (
    <RecordingContext.Provider value={{ isRecording, pendingSteps, start, record, stop, consumePending }}>
      {children}
    </RecordingContext.Provider>
  )
}

export const useRecording = () => useContext(RecordingContext)
