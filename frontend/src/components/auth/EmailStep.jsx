// src/components/auth/EmailStep.jsx
/*
================================================================================
File Name : EmailStep.jsx
Author : Tahseen Raza
Created Date : 2026-06-20
Description : Email input step for authentication
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import { useState } from 'react'

const EmailStep = ({ onSubmit, isDark }) => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Simulate checking if user exists
    const checkUserExists = (email) => {
        // For demo purposes, check if email contains 'test' or ends with @existing.com
        const existingEmails = ['test@example.com', 'user@existing.com', 'demo@vaahan.com']
        return existingEmails.some(e => e.toLowerCase() === email.toLowerCase())
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!email) {
            setError('Please enter your email address')
            return
        }

        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/  
          if (!emailRegex.test(email)) {
            setError('Please enter a valid email address')
            return
        }

        setLoading(true)
        setError('')

        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            const isExisting = checkUserExists(email)
            onSubmit(email, isExisting)
        }, 1500)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Email Address
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setError('')
                    }}
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 ${isDark
                            ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                    autoFocus
                    disabled={loading}
                />
                {error && (
                    <p className="mt-1.5 text-sm text-red-500">{error}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 ${loading
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    }`}
            >
                {loading ? 'Checking...' : 'Continue'}
            </button>

            <p className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
        </form>
    )
}

export default EmailStep