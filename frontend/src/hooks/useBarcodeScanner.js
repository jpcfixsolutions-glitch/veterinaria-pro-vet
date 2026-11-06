import { useCallback, useEffect, useRef, useState } from 'react'

export const normalizeBarcode = (value) => String(value ?? '').trim()

// Las lectoras USB que emulan teclado terminan habitualmente cada lectura con Enter.
// La cola conserva lecturas consecutivas y evita procesar dos veces el mismo Enter.
export function useBarcodeScanner({ onScan, disabled = false, restoreFocus = true }) {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(0)
  const inputRef = useRef(null)
  const onScanRef = useRef(onScan)
  const queueRef = useRef(Promise.resolve())

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  const submit = useCallback(() => {
    const barcode = normalizeBarcode(value)
    if (!barcode || disabled) return

    setValue('')
    setPending((count) => count + 1)
    queueRef.current = queueRef.current
      .catch(() => undefined)
      .then(() => onScanRef.current(barcode))
      .catch(() => undefined)
      .finally(() => {
        setPending((count) => Math.max(0, count - 1))
        if (restoreFocus) window.setTimeout(() => inputRef.current?.focus(), 0)
      })
  }, [disabled, restoreFocus, value])

  const onKeyDown = useCallback((event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    submit()
  }, [submit])

  return { inputRef, value, setValue, onKeyDown, submit, isScanning: pending > 0 }
}
