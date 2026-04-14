'use client'

import { useState, useTransition } from 'react'
import { runImport } from '@/lib/actions'

export default function ImportForm() {
  const [file,    setFile]    = useState<File | null>(null)
  const [result,  setResult]  = useState<{ orders: number; payments: number; items: number } | null>(null)
  const [error,   setError]   = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!file) { setError('Selecione o arquivo seed_data.json.'); return }

    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      startTransition(async () => {
        try {
          const res = await runImport(text)
          setResult(res)
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Erro na importação.')
        }
      })
    }
    reader.readAsText(file)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">Arquivo seed_data.json</label>
        <input
          type="file"
          accept=".json,application/json"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
        />
      </div>

      {error  && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {result && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4">
          <p className="font-semibold text-green-800 mb-2">✅ Importação concluída com sucesso!</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>{result.items}</strong> itens importados/atualizados</li>
            <li>• <strong>{result.orders}</strong> pedidos importados</li>
            <li>• <strong>{result.payments}</strong> pagamentos importados</li>
          </ul>
          <p className="text-sm text-green-600 mt-2">Acesse o <a href="/" className="underline font-medium">Dashboard</a> para verificar o saldo.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !file || !!result}
        className="btn-primary"
      >
        {isPending ? 'Importando… aguarde' : result ? 'Importação concluída' : 'Importar'}
      </button>
    </form>
  )
}
