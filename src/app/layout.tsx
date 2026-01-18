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
      <body className="bg-yellow-600">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
