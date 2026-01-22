import Navbar from '@/components/Navbar'
import './globals.css'

export const metadata = {
  title: 'Data4Research',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-100 via-blue-50 to-sky-100">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
