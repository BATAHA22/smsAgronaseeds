'use client'

import { useState, useRef, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Send, FileSpreadsheet, CheckCircle2, XCircle, Leaf, Tractor, UserPlus, Sparkles, Trash2, Home, Building2, MessageSquare, Calculator, Smartphone } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MessageEditor } from '@/components/message-editor'

interface Customer {
  id: string
  name: string
  phone: string
  status: 'pending' | 'sent' | 'failed'
  data: Record<string, string>
}

const MESSAGE_TEMPLATES = [
  { 
    label: 'رفض الاستلام', 
    value: `السلام عليكم [المستلم]،
نستفسر فقط عن سبب طلبكم لمنتج أقرونا للبذور ثم رفض استلامه بعد وصوله، خاصة وأنه تم تحضيره وشحنه خصيصًا لكم.
إذا كان هناك أي ملاحظة أو تردد، يسعدنا توضيحه ومساعدتكم.
بانتظار ردكم، وشكرًا لتفهمكم.

أقرونا للبذور 🌱` 
  },
  { 
    label: 'تم الشحن (صباحًا)', 
    value: `مرحبا [المستلم]،
تم شحن طلبيتك، وستصلك اليوم صباحًا بإذن الله 🌱
يرجى الاستعداد لاستلامها والرد على اتصال الموزع عند تواصله معكم لضمان التسليم في الوقت المناسب.
شكراً لثقتكم في أقرونا للبذور
وصحا فطوركم 🌙✨` 
  },
  { 
    label: 'تم الشحن (أندرسون)', 
    value: `مرحبا [المستلم]،
تم شحن طلبيتك، وستصل صباحًا بإذن الله 🌱

يرجى انتظار اتصال شركة أندرسون أولاً، ثم التوجه إلى المكتب لاستلام الطرد بعد تواصلهم معكم.
الرجاء الرد على الاتصال لضمان عدم إرجاع الشحنة.

شكراً لثقتكم في أقرونا للبذور
وصحا فطوركم 🌙✨` 
  },
  { 
    label: 'وصول الطلبية (بذور السدر)', 
    value: `مرحبا [المستلم]،
نحيطكم علمًا أن طلبية بذور السدر من أقرونا للبذور قد وصلت، والموزّع يحاول الاتصال بكم من أجل تسليمها.
نرجو منكم الردّ عليه في أقرب وقت لتأكيد الاستلام وتفادي إرجاع الطلبية.
شكرًا لتعاونكم وثقتكم بنا 🌿
أقرونا للبذور` 
  },
  { 
    label: 'Agrona Farm شحن', 
    value: `لقد قمنا بشحن طلبيتك [المستلم]، وستصلك صباحًا بإذن الله.
نرجو منكم الاستعداد لاستلامها والردّ على اتصال الموزّع عند تواصله معكم.
شكرًا لثقتكم بنا 🌱
Agrona Farm` 
  },
]

const SENDER_OPTIONS = [
  { value: '+213660591470', label: 'AgronaSeeds', icon: Leaf, color: 'text-green-600 bg-green-50' },
  { value: '+213550090981', label: 'AgronaFarm', icon: Tractor, color: 'text-amber-600 bg-amber-50' },
]

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [messageTemplate, setMessageTemplate] = useState(MESSAGE_TEMPLATES[1].value)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [senderPhone, setSenderPhone] = useState(SENDER_OPTIONS[0].value)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Manual Entry State
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = String(phone).replace(/\s/g, '').replace(/-/g, '')
    // Algerian format heuristic
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return `+213${cleanPhone.substring(1)}`
    }
    // Case: 9 digits (e.g. 550090981) -> +213550090981
    if (cleanPhone.length === 9) {
      return `+213${cleanPhone}`
    }
    if (cleanPhone.startsWith('213')) {
      return `+${cleanPhone}`
    }
    return cleanPhone
  }

  const getShippingIcon = (serviceType: string | undefined) => {
    if (!serviceType) return null
    const type = serviceType.toLowerCase().trim()
    
    if (type.includes('domicile') || type.includes('home')) {
      return (
        <span title="توصيل للمنزل" className="inline-flex p-1 rounded-md bg-blue-50 text-blue-600">
          <Home className="h-4 w-4" />
        </span>
      )
    }
    
    if (type.includes('stop') || type.includes('desk') || type.includes('bureau') || type.includes('office')) {
      return (
        <span title="استلام من المكتب" className="inline-flex p-1 rounded-md bg-orange-50 text-orange-600">
          <Building2 className="h-4 w-4" />
        </span>
      )
    }
    
    return null
  }

  const messageEditorRef = useRef<HTMLTextAreaElement>(null)

  const stats = useMemo(() => {
    let mobilis = 0
    let djezzy = 0
    let ooredoo = 0
    let office = 0
    let home = 0
    
    // Calculate message cost per unit
    // 1-160 chars = 7 DA, 161+ chars = 14 DA (assuming max 320 for simplicity, or 7 per segment)
    // The prompt says: "160 char 7DA, 161 char 14DA". This implies a step function.
    const msgLen = messageTemplate.length
    const unitCost = msgLen <= 160 ? 7 : 14

    customers.forEach(c => {
      // Normalize phone
      let p = c.phone.replace(/\s/g, '').replace(/-/g, '')
      if (p.startsWith('+213')) p = '0' + p.substring(4)
      
      if (p.startsWith('06')) {
        mobilis++
        // Mobilis is free
      } else if (p.startsWith('07')) {
        djezzy++
      } else if (p.startsWith('05')) {
        ooredoo++
      }

      // Office/Home logic
      const type = (c.data['نوع الخدمة'] || c.data['Service Type'] || c.data['Type'] || '').toLowerCase().trim()
      if (type.includes('domicile') || type.includes('home')) {
        home++
      } else if (type.includes('stop') || type.includes('desk') || type.includes('bureau') || type.includes('office')) {
        office++
      }
    })

    const totalCost = (djezzy + ooredoo) * unitCost
    
    return { mobilis, djezzy, ooredoo, office, home, totalCost, unitCost }
  }, [customers, messageTemplate])

  const handleDeleteGroup = (type: 'office' | 'home') => {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return
    
    setCustomers(prev => prev.filter(c => {
      const t = (c.data['نوع الخدمة'] || c.data['Service Type'] || c.data['Type'] || '').toLowerCase().trim()
      if (type === 'home' && (t.includes('domicile') || t.includes('home'))) return false
      if (type === 'office' && (t.includes('stop') || t.includes('desk') || t.includes('bureau') || t.includes('office'))) return false
      return true
    }))
    toast.success('تم حذف المجموعة بنجاح')
  }

  const insertVariable = (col: string) => {
    const textarea = messageEditorRef.current
    const insertion = ` [${col}]`
    
    if (!textarea) {
      setMessageTemplate(prev => prev + insertion)
      return
    }
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = messageTemplate
    
    const newText = text.substring(0, start) + insertion + text.substring(end)
    setMessageTemplate(newText)
    
    // Restore cursor position and focus
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + insertion.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' }) as (string | number)[][]

        // Find the header row that contains both "المستلم" and "الهاتف"
        const norm = (v: unknown) => String(v ?? '').trim()
        const headerRowIndex = rows.findIndex(row => {
          const normalized = row.map(norm)
          return normalized.includes('المستلم') && normalized.includes('الهاتف')
        })

        if (headerRowIndex === -1) {
          toast.error('لم يتم العثور على رؤوس الأعمدة &quot;المستلم&quot; و &quot;الهاتف&quot;')
          return
        }

        const headerRow = rows[headerRowIndex].map(norm) as string[]
        const nameIdx = headerRow.findIndex(c => c === 'المستلم')
        const phoneIdx = headerRow.findIndex(c => c === 'الهاتف')

        // Store available columns for variables
        setAvailableColumns(headerRow.filter(h => h.length > 0))

        const extractedCustomers: Customer[] = []
        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r]
          const name = norm(row[nameIdx])
          const phoneCell = row[phoneIdx]
          const phoneStr = norm(phoneCell)
          
          if (name && phoneStr) {
            // Capture all row data for variables
            const rowData: Record<string, string> = {}
            headerRow.forEach((header, idx) => {
              if (header) {
                rowData[header] = norm(row[idx])
              }
            })

            extractedCustomers.push({
              id: `row-${r}`,
              name,
              phone: formatPhoneNumber(phoneStr),
              status: 'pending',
              data: rowData
            })
          }
        }

        if (extractedCustomers.length === 0) {
          toast.error('لم يتم العثور على بيانات صالحة. تأكد من وجود أعمدة &quot;المستلم&quot; و &quot;الهاتف&quot;')
        } else {
          setCustomers(extractedCustomers)
          toast.success(`تم استيراد ${extractedCustomers.length} عميل بنجاح`)
        }
      } catch {
        toast.error('حدث خطأ أثناء قراءة الملف')
      }
    }
    reader.readAsBinaryString(file)
  }

  const sendSmsToAll = async () => {
    if (customers.length === 0) {
      toast.error('لا يوجد عملاء للإرسال')
      return
    }

    // In a real scenario, we might want to validate API Key here or on server
    // For now, let's assume it's handled via server env or input
    // Since the prompt shows "x-api-Key: YOUR_API_KEY", I'll ask user for it if not in env
    
    // Check if API Key is needed
    // const key = apiKey || process.env.NEXT_PUBLIC_HTTPSMS_API_KEY
    // if (!key) {
    //   toast.error('الرجاء إدخال مفتاح API')
    //   return
    // }

    setIsProcessing(true)
    let successCount = 0
    let failCount = 0

    // Clone customers to update status
    const newCustomers = [...customers]

    // Process in batches or sequentially
    for (let i = 0; i < newCustomers.length; i++) {
      const customer = newCustomers[i]
      if (customer.status === 'sent') continue // Skip already sent

      // Replace variables in message
      let finalMessage = messageTemplate
      // Replace known placeholders first
      finalMessage = finalMessage.replace(/\[المستلم\]/g, customer.name)
      finalMessage = finalMessage.replace(/\[الهاتف\]/g, customer.phone)
      
      // Replace dynamic variables from Excel columns
      Object.keys(customer.data).forEach(key => {
        const regex = new RegExp(`\\[${key}\\]`, 'g')
        finalMessage = finalMessage.replace(regex, customer.data[key] || '')
      })

      const payload = {
        phone: customer.phone,
        message: finalMessage,
        from: senderPhone || undefined
      }

      console.log('Sending SMS Payload:', payload)

      try {
        const response = await fetch('/api/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (result.success) {
          newCustomers[i].status = 'sent'
          successCount++
        } else {
          newCustomers[i].status = 'failed'
          failCount++
        }
      } catch {
        newCustomers[i].status = 'failed'
        failCount++
      }

      // Update UI progressively
      setCustomers([...newCustomers])
      // Add a small delay to avoid rate limits if necessary
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsProcessing(false)
    toast.info(`كتملت العملية: ${successCount} نجاح, ${failCount} فشل`)
  }

  const handleAddManualCustomer = () => {
    if (!newCustomerName || !newCustomerPhone) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف')
      return
    }

    const formattedPhone = formatPhoneNumber(newCustomerPhone)
    const newCustomer: Customer = {
      id: `manual-${Date.now()}`,
      name: newCustomerName,
      phone: formattedPhone,
      status: 'pending',
      data: { source: 'manual' } // Mark as manual
    }

    setCustomers(prev => [...prev, newCustomer])
    setNewCustomerName('')
    setNewCustomerPhone('')
    setIsManualEntryOpen(false)
    toast.success('تمت إضافة العميل بنجاح')
  }

  const enhanceMessageWithAI = async () => {
    if (!messageTemplate) return
    
    const toastId = toast.loading('جاري تحسين الرسالة باستخدام الذكاء الاصطناعي...')
    
    try {
      // Simulation for now, or connect to actual API route
      // For real Mistral integration, we'd need an API route
      const response = await fetch('/api/enhance-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageTemplate })
      })
      
      const data = await response.json()
      if (data.enhancedText) {
        setMessageTemplate(data.enhancedText)
        toast.success('تم تحسين الرسالة', { id: toastId })
      } else {
        toast.error('فشل تحسين الرسالة', { id: toastId })
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي', { id: toastId })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-600" />
            نظام إرسال الرسائل
          </h1>
          <button 
            onClick={() => {
              document.cookie = 'auth_session=; Max-Age=0; path=/;'
              window.location.reload()
            }}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            تسجيل خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Section: Upload & Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Upload */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                استيراد البيانات
              </h2>
              <div className="relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer transition-all"
                />
              </div>
              <p className="mt-3 text-xs text-gray-400">
                الملف يجب أن يحتوي على أعمدة &quot;المستلم&quot; و &quot;الهاتف&quot;
              </p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم المرسل
              </label>
              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  {SENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSenderPhone(option.value)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                        senderPhone === option.value
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                          : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn("p-2 rounded-full", option.color)}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      {senderPhone === option.value && (
                        <div className="absolute top-2 right-2">
                          <span className="block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Message Composer */}
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Send className="h-4 w-4" />
                </span>
                نص الرسالة
              </h2>
              <div className="flex gap-2">
                 <button
                  onClick={enhanceMessageWithAI}
                  className="flex items-center gap-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 px-4 py-2.5 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  تحسين بالذكاء الاصطناعي
                </button>
                 <button
                  onClick={sendSmsToAll}
                  disabled={isProcessing || customers.length === 0}
                  className={cn(
                    "flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 hover:shadow-lg active:scale-95 transition-all",
                    (isProcessing || customers.length === 0) && "opacity-50 cursor-not-allowed shadow-none"
                  )}
                >
                  {isProcessing ? 'جاري الإرسال...' : 'إرسال للجميع'}
                  {!isProcessing && <Send className="h-4 w-4 -ml-1" />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <MessageEditor
                  ref={messageEditorRef}
                  value={messageTemplate}
                  onChange={setMessageTemplate}
                  placeholder="اكتب نص الرسالة هنا..."
                />
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-gray-400">
                    {messageTemplate.length} حرف | {messageTemplate.trim().split(/\s+/).filter(w => w.length > 0).length} كلمة
                  </span>
                </div>
              </div>

              {/* Variables Chips */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">إدراج متغير:</p>
                <div className="flex flex-wrap gap-2">
                  {availableColumns.length > 0 ? (
                    availableColumns.map((col) => (
                      <button
                        key={col}
                        onClick={() => insertVariable(col)}
                        className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100"
                      >
                        {col} +
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">قم برفع ملف لإظهار المتغيرات المتاحة</span>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-medium text-gray-500 mb-2">قوالب جاهزة:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                   {MESSAGE_TEMPLATES.map(t => (
                     <button
                        key={t.value}
                        onClick={() => setMessageTemplate(t.value)}
                        className="group relative flex flex-col items-start gap-1 p-2 rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all text-right"
                     >
                       <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                         <MessageSquare className="h-3 w-3" />
                         {t.label}
                       </span>
                       <span className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 w-full">
                         {t.value}
                       </span>
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Results Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
          {/* Stats Bar */}
          {customers.length > 0 && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/30">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                   <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                     <Smartphone className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">موبيليس (06)</p>
                     <p className="text-lg font-bold text-gray-900">{stats.mobilis}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                   <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                     <Smartphone className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">أوريدو (05)</p>
                     <p className="text-lg font-bold text-gray-900">{stats.ooredoo}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                   <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                     <Smartphone className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">جيزي (07)</p>
                     <p className="text-lg font-bold text-gray-900">{stats.djezzy}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                   <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                     <Calculator className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">التكلفة التقديرية</p>
                     <p className="text-lg font-bold text-gray-900">{stats.totalCost} دج</p>
                     <p className="text-[10px] text-gray-400">({stats.unitCost} دج/رسالة)</p>
                   </div>
                </div>
             </div>
          )}

          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50 dark:bg-zinc-800/20">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                قائمة العملاء
              </h3>
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {customers.length} عميل
              </span>
            </div>

            {/* Bulk Actions */}
             {customers.length > 0 && (
               <div className="flex items-center gap-2">
                 {stats.office > 0 && (
                   <button
                     onClick={() => handleDeleteGroup('office')}
                     className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                   >
                     <Trash2 className="h-3 w-3" />
                     حذف المكتب ({stats.office})
                   </button>
                 )}
                 {stats.home > 0 && (
                   <button
                     onClick={() => handleDeleteGroup('home')}
                     className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                   >
                     <Trash2 className="h-3 w-3" />
                     حذف المنزل ({stats.home})
                   </button>
                 )}
               </div>
             )}

            <div className="flex gap-2">
              <button 
                onClick={() => setIsManualEntryOpen(true)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                إضافة عميل
              </button>
              {customers.length > 0 && (
                <button 
                  onClick={() => {
                    setCustomers([])
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                    setAvailableColumns([])
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  مسح القائمة
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {customers.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">لا توجد بيانات</h3>
                <p className="mt-1 text-sm text-gray-500">قم برفع ملف Excel من الأعلى لعرض البيانات هنا</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
                <thead className="bg-gray-50/80 dark:bg-zinc-800/50">
                  <tr>
                    <th scope="col" className="py-4 pl-4 pr-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th scope="col" className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      المستلم
                    </th>
                    <th scope="col" className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      رقم الهاتف
                    </th>
                    {/* Dynamic Headers (First 3 extra cols) */}
                    {availableColumns.filter(c => c !== 'المستلم' && c !== 'الهاتف').slice(0, 3).map(col => (
                       <th key={col} scope="col" className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                         {col}
                       </th>
                    ))}
                    <th scope="col" className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">حذف</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {customers.map((customer, idx) => (
                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-6 text-sm font-medium text-gray-900 dark:text-white">
                        {idx + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          {customer.name}
                          {getShippingIcon(customer.data['نوع الخدمة'] || customer.data['Service Type'] || customer.data['Type'])}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono text-xs" dir="ltr">
                        {customer.phone}
                      </td>
                       {/* Dynamic Data Cells */}
                       {availableColumns.filter(c => c !== 'المستلم' && c !== 'الهاتف').slice(0, 3).map(col => (
                         <td key={col} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 max-w-[150px] truncate">
                           {customer.data[col]}
                         </td>
                      ))}
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {customer.status === 'pending' && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            قيد الانتظار
                          </span>
                        )}
                        {customer.status === 'sent' && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            <CheckCircle2 className="ml-1 h-3 w-3" />
                            تم الإرسال
                          </span>
                        )}
                        {customer.status === 'failed' && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                            <XCircle className="ml-1 h-3 w-3" />
                            فشل
                          </span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setCustomers(prev => prev.filter(c => c.id !== customer.id))
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">حذف {customer.name}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Manual Entry Modal */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">إضافة عميل جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="block w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow sm:text-sm"
                  placeholder="مثال: محمد أحمد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  dir="ltr"
                  className="block w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow sm:text-sm"
                  placeholder="مثال: 0660..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddManualCustomer}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-colors"
                >
                  إضافة
                </button>
                <button
                  onClick={() => setIsManualEntryOpen(false)}
                  className="flex-1 rounded-xl bg-gray-100 dark:bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
