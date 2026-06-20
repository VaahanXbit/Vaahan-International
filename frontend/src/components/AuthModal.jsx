// src/components/AuthModal.jsx
/*
================================================================================
File Name : AuthModal.jsx
Author : Tahseen Raza
Created Date : 2026-06-20
Description : Authentication Modal with perfectly matched open & close animations
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

// Import step components
import EmailStep from './auth/EmailStep'
import PasswordStep from './auth/PasswordStep'
import OTPStep from './auth/OTPStep'
import ProfileStep from './auth/ProfileStep'

const AuthModal = ({ isOpen, onClose, triggerRef }) => {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [buttonPosition, setButtonPosition] = useState(null)
  const { isDark } = useTheme()
  const modalRef = useRef(null)

  // Get button position when modal opens
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setButtonPosition({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      })
    }
  }, [isOpen, triggerRef])

  // Reset state when modal closes - wait for animation to complete
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep('email')
        setEmail('')
        setIsExistingUser(false)
        setButtonPosition(null)
      }, 1400) // Wait for full exit animation
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle email submission
  const handleEmailSubmit = (emailValue, isExisting) => {
    setEmail(emailValue)
    setIsExistingUser(isExisting)
    setStep(isExisting ? 'password' : 'otp')
  }

  // Handle OTP verification
  const handleOTPVerify = () => {
    setStep('profile')
  }

  // Handle password login
  const handlePasswordLogin = () => {
    onClose()
  }

  // Handle profile creation
  const handleProfileCreate = () => {
    onClose()
  }

  // Handle back navigation
  const handleBack = () => {
    if (step === 'password') {
      setStep('email')
    } else if (step === 'otp') {
      setStep('email')
    } else if (step === 'profile') {
      setStep('otp')
    }
  }

  // Get step title
  const getStepTitle = () => {
    switch(step) {
      case 'email': return 'Welcome Back'
      case 'password': return 'Welcome Back'
      case 'otp': return 'Verify Your Email'
      case 'profile': return 'Complete Your Profile'
      default: return ''
    }
  }

  // Get step subtitle
  const getStepSubtitle = () => {
    switch(step) {
      case 'email': return 'Sign in to continue to your account'
      case 'password': return `Signing in as ${email}`
      case 'otp': return `Enter the 6-digit code sent to ${email}`
      case 'profile': return 'Just a few more details to get started'
      default: return ''
    }
  }

  // Get step icon
  const getStepIcon = () => {
    switch(step) {
      case 'email': return '👋'
      case 'password': return '🔐'
      case 'otp': return '✉️'
      case 'profile': return '✨'
      default: return ''
    }
  }

  // Calculate transform origin for zoom effect
  const getTransformOrigin = () => {
    if (!buttonPosition) return 'center center'
    const xPercent = (buttonPosition.centerX / window.innerWidth) * 100
    const yPercent = (buttonPosition.centerY / window.innerHeight) * 100
    return `${xPercent}% ${yPercent}%`
  }

  // Calculate the offset for zoom out animation (move to button position)
  const getZoomOutOffset = () => {
    if (!buttonPosition) return { x: 0, y: 0 }
    
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    const offsetX = buttonPosition.centerX - centerX
    const offsetY = buttonPosition.centerY - centerY
    
    return { x: offsetX, y: offsetY }
  }

  const zoomOutOffset = getZoomOutOffset()

  // SLOW SPRING for opening
  const openSpring = {
    type: "spring",
    stiffness: 220,
    damping: 35,
    mass: 1.3,
    duration: 1.2,
  }

  // SLOW EASING for closing - MATCHES the spring feel
  const closeEasing = {
    duration: 1.2,
    ease: [0.22, 1, 0.36, 1], // Custom easing that mimics spring
  }

  // Content transitions - SLOW for both
  const contentTransition = {
    duration: 0.9,
    ease: [0.22, 1, 0.36, 1],
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - SLOW for both */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50"
            onClick={onClose}
          />
          
          {/* Modal Container - Centered */}
          <motion.div
            ref={modalRef}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4"
            initial={{ 
              opacity: 0,
              scale: 0.12,
              x: 0,
              y: 0,
            }}
            animate={{ 
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              transition: openSpring,
            }}
            exit={{ 
              opacity: 0,
              scale: 0.08,
              x: zoomOutOffset.x * 0.9,
              y: zoomOutOffset.y * 0.9,
              transition: closeEasing, // SAME duration as open
            }}
            style={{
              transformOrigin: getTransformOrigin(),
            }}
          >
            <div className="pointer-events-auto w-full max-w-sm">
              {/* Modal content with SLOW scale bounce */}
              <motion.div
                initial={{ 
                  scale: 0.8,
                  y: 40,
                }}
                animate={{ 
                  scale: 1,
                  y: 0,
                  transition: {
                    delay: 0.1,
                    type: "spring",
                    stiffness: 280,
                    damping: 35,
                    mass: 1.2,
                  }
                }}
                exit={{ 
                  scale: 0.8,
                  y: 40,
                  transition: {
                    duration: 1.0, // SLOW - matches opening
                    ease: [0.22, 1, 0.36, 1],
                  }
                }}
                className={`rounded-2xl shadow-2xl overflow-hidden relative ${
                  isDark ? 'bg-dark-800' : 'bg-white'
                }`}
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isDark 
                      ? 'hover:bg-dark-700 text-gray-400 hover:text-white hover:rotate-90' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 hover:rotate-90'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header with icon - SLOW entrance and exit */}
                <div className={`px-6 pt-6 pb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <motion.div 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: 0.2, ...contentTransition }
                    }}
                    exit={{
                      opacity: 0,
                      x: -20,
                      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
                    }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
                    }`}>
                      <span className="text-xl">{getStepIcon()}</span>
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getStepTitle()}
                      </h2>
                      <p className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {getStepSubtitle()}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Content - SLOW entrance and exit */}
                <motion.div 
                  className="px-6 py-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.35, ...contentTransition }
                  }}
                  exit={{
                    opacity: 0,
                    y: 30,
                    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
                  }}
                >
                  {step === 'email' && (
                    <EmailStep 
                      onSubmit={handleEmailSubmit}
                      isDark={isDark}
                    />
                  )}
                  {step === 'password' && (
                    <PasswordStep 
                      email={email}
                      onLogin={handlePasswordLogin}
                      onBack={handleBack}
                      isDark={isDark}
                    />
                  )}
                  {step === 'otp' && (
                    <OTPStep 
                      email={email}
                      onVerify={handleOTPVerify}
                      onBack={handleBack}
                      isDark={isDark}
                    />
                  )}
                  {step === 'profile' && (
                    <ProfileStep 
                      email={email}
                      onCreate={handleProfileCreate}
                      onBack={handleBack}
                      isDark={isDark}
                    />
                  )}
                </motion.div>

                {/* Footer - SLOW entrance and exit */}
                <motion.div 
                  className={`px-6 py-3 border-t ${
                    isDark ? 'border-dark-700' : 'border-gray-100'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    transition: { delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
                  }}
                >
                  <p className={`text-center text-[10px] ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {step === 'email' && '🔒 Secure access to your account'}
                    {step === 'password' && '🔒 Your data is encrypted and secure'}
                    {step === 'otp' && '📧 Check your spam folder if you don\'t see the email'}
                    {step === 'profile' && '✨ Help us personalize your experience'}
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AuthModal