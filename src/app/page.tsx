/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, BellOff, Send, Download, Share, X, Check, Smartphone } from "lucide-react"
import { subscribeUser, unsubscribeUser, sendNotification } from "@/app/actions"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function Page() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [message, setMessage] = useState("")
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      registerServiceWorker()
    }

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serializedSub)
      showSuccessMessage()
    } catch (error) {
      console.error("Failed to subscribe:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeUser()
      showSuccessMessage()
    } catch (error) {
      console.error("Failed to unsubscribe:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return

    setIsLoading(true)
    try {
      await sendNotification(message)
      setMessage("")
      showSuccessMessage()
    } catch (error) {
      console.error("Failed to send notification:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function showSuccessMessage() {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-md mx-auto">
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">PWA Features</h1>
          <p className="text-indigo-600">Stay connected with push notifications and easy installation</p>
        </motion.div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-center"
            >
              <Check className="mr-2" size={18} />
              <span>Action completed successfully!</span>
              <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-700 hover:text-green-900">
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-xl p-6 mb-6 overflow-hidden relative">
          <motion.div
            className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-100 rounded-full opacity-50"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />

          <motion.div
            className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-100 rounded-full opacity-50"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />

          <div className="relative">
            <div className="flex items-center mb-4">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: subscription ? [0, -10, 10, -10, 10, 0] : 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 5,
                }}
                className="bg-indigo-100 p-3 rounded-full mr-4"
              >
                {subscription ? (
                  <Bell size={24} className="text-indigo-600" />
                ) : (
                  <BellOff size={24} className="text-indigo-400" />
                )}
              </motion.div>
              <h2 className="text-xl font-semibold text-indigo-800">Push Notifications</h2>
            </div>

            {!isSupported ? (
              <motion.p variants={itemVariants} className="text-red-500 mb-4">
                Push notifications are not supported in this browser.
              </motion.p>
            ) : (
              <AnimatePresence mode="wait">
                {subscription ? (
                  <motion.div
                    key="subscribed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.p variants={itemVariants} className="text-green-600 mb-4 flex items-center">
                      <Check size={18} className="mr-2" />
                      You are subscribed to push notifications
                    </motion.p>

                    <motion.div variants={itemVariants} className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter notification message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full p-3 pr-12 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          disabled={isLoading || !message.trim()}
                          onClick={sendTestNotification}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-500 hover:text-indigo-700 disabled:text-gray-300"
                        >
                          <Send size={20} />
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      disabled={isLoading}
                      onClick={unsubscribeFromPush}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center disabled:bg-red-300"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <BellOff size={18} className="mr-2" />
                          Unsubscribe
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unsubscribed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.p variants={itemVariants} className="text-indigo-600 mb-4">
                      Get notified about important updates and events
                    </motion.p>

                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      disabled={isLoading}
                      onClick={subscribeToPush}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center disabled:bg-indigo-400"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Bell size={18} className="mr-2" />
                          Subscribe to Notifications
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {!isStandalone && (
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-xl p-6 relative overflow-hidden">
            <motion.div
              className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-100 rounded-full opacity-50"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 7,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />

            <div className="relative">
              <div className="flex items-center mb-4">
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  className="bg-purple-100 p-3 rounded-full mr-4"
                >
                  <Smartphone size={24} className="text-purple-600" />
                </motion.div>
                <h2 className="text-xl font-semibold text-purple-800">Install App</h2>
              </div>

              {isIOS ? (
                <motion.div variants={itemVariants}>
                  <p className="text-purple-600 mb-4">To install this app on your iOS device:</p>
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <ol className="list-decimal list-inside space-y-2 text-purple-700">
                      <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Tap the share button <Share size={16} className="inline" />
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        Scroll and tap &quot;Add to Home Screen&quot; <Download size={16} className="inline" />
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        Tap &quot;Add&quot; in the top right corner
                      </motion.li>
                    </ol>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants}>
                  <p className="text-purple-600 mb-4">
                    Install this app on your device for quick access even when offline
                  </p>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <Download size={18} className="mr-2" />
                    Add to Home Screen
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

