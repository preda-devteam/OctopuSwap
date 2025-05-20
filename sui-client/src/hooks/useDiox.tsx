'use client'
import React, { useEffect, useState, createContext } from 'react'
import detect from '@dioxide-js/detect-provider'

const Context = createContext<{ dioxide: any }>({ dioxide: null })
const Provider = Context.Provider

export const useDioxContext = () => React.useContext(Context)

export function DioxContextProvider({ children }: { children: React.ReactNode }) {
  // add all the logic, side effects here and pass them to value
  const [dioxide, setDioxide] = useState<any>(null)

  useEffect(() => {
    detect({ timeout: 3000 }).then(d => {
      setDioxide(d)
    })
  }, [])

  return <Provider value={{ dioxide }}>{children}</Provider>
}
