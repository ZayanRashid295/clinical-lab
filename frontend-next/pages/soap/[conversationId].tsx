"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { MenuSystem, authService } from "../../src/shared"
import { transportationContentRegistry } from "../../src/app/config/content.registry"
import { SoapConversationRoute } from "../../src/app/components/medprep-ai/fyp/soap-conversation-route"

export default function SoapConversationPage() {
  const router = useRouter()
  const raw = router.query.conversationId
  const conversationId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : ""
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/")
      return
    }
    setAuthReady(true)
  }, [router])

  const customContent = useMemo(() => {
    if (!conversationId) return {}
    return {
      [`/soap/${conversationId}`]: () => <SoapConversationRoute conversationId={conversationId} />,
    }
  }, [conversationId])

  if (!router.isReady || !authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  if (!conversationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p className="text-sm text-muted-foreground">Invalid conversation.</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>SOAP Note — Clinical Lab</title>
        <meta name="description" content="Document and submit your SOAP note for this case." />
      </Head>
      <MenuSystem
        contentRegistry={transportationContentRegistry}
        applicationTitle="Clinical Lab"
        customContent={customContent}
      />
    </>
  )
}
