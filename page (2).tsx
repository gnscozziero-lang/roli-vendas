import ImportForm from './ImportForm'

export default function ImportarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Dados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Importe o arquivo <code className="font-mono bg-gray-100 px-1 rounded">seed_data.json</code> gerado a partir da planilha histórica.
          <strong className="text-red-600 ml-2">Atenção: execute apenas uma vez no banco vazio.</strong>
        </p>
      </div>

      <div className="card p-6">
        <ImportForm />
      </div>

      {/* Instruções */}
      <div className="card p-6 bg-yellow-50 border-yellow-200">
        <h2 className="font-semibold text-yellow-900 mb-3">Como usar</h2>
        <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
          <li>Execute o schema SQL no SQL Editor do Neon (arquivo <code className="font-mono">supabase/schema.sql</code>).</li>
          <li>Faça o deploy no Vercel com a variável <code className="font-mono">DATABASE_URL</code> configurada.</li>
          <li>Acesse esta página e selecione o arquivo <code className="font-mono">seed_data.json</code> que acompanha o projeto.</li>
          <li>Clique em <strong>Importar</strong>. O processo levará alguns segundos.</li>
          <li>Após importar, verifique o dashboard. Saldo inicial esperado: <strong>R$ 5.805,39</strong>.</li>
          <li><strong>Não importe duas vezes</strong> — criará duplicatas. Se necessário, limpe as tabelas no Supabase antes de reimportar.</li>
        </ol>
      </div>
    </div>
  )
}
