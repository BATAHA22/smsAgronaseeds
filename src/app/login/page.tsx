'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('تم تسجيل الدخول بنجاح')
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error('كلمة المرور غير صحيحة')
      }
    } catch {
      toast.error('حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-950 dark:to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <Toaster position="top-center" richColors />
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-tr from-purple-400 to-blue-400 rounded-3xl" />
        <div className="w-full space-y-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur border shadow-xl p-6 md:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-zinc-800">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              الدخول للنظام
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              الرجاء إدخال كلمة المرور للمتابعة
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="password" className="sr-only">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-xl border-0 py-3 text-gray-900 dark:text-white bg-white/70 dark:bg-zinc-800/70 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-4"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 hover:shadow-xl active:scale-[0.99] transition",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? 'جاري التحقق...' : 'دخول'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
