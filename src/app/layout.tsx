import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { type ReactNode } from 'react'
import { cookieToInitialState } from 'wagmi'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'etherjs-flow-evm-demo',
  description: 'etherjs-flow-evm-demo',
}

export default function RootLayout(props: { children: ReactNode }) {

  return (
    <html lang="en">
      <body className={inter.className}>
        {props.children}
      </body>
    </html>
  )
}
