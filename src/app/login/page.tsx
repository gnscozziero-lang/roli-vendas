import { loginAction } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string }
}) {
  const next = searchParams.next || '/'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form action={loginAction} className="card w-full max-w-sm p-6">
        <p className="text-center text-2xl font-bold mb-6">🔑 Vendas</p>
        <input type="hidden" name="next" value={next} />
        <label className="label">Senha de acesso</label>
        <input
          type="password"
          name="password"
          autoFocus
          required
          className="input mb-2"
          placeholder="Digite a senha"
        />
        {searchParams.error && (
          <p className="text-red-600 text-sm mb-4">Senha incorreta.</p>
        )}
        <button type="submit" className="btn-primary w-full mt-4">
          Entrar
        </button>
      </form>
    </div>
  )
}
