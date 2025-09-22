import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Alert } from '../components/ui/Alert'
import toast from 'react-hot-toast'

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, resendEmailVerification, checkEmailVerificationStatus, error, clearError } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null)

  // Get email from URL params or user data
  const email = searchParams.get('email') || user?.email || ''

  useEffect(() => {
    // Check verification status on component mount
    const checkStatus = async () => {
      if (user) {
        setIsChecking(true)
        try {
          const status = await checkEmailVerificationStatus()
          setVerificationStatus(status)

          if (status) {
            toast.success('Email verified successfully!')
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
          }
        } catch (error) {
          console.error('Error checking verification status:', error)
        } finally {
          setIsChecking(false)
        }
      }
    }

    checkStatus()
  }, [user, checkEmailVerificationStatus, navigate])

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      await resendEmailVerification()
      toast.success('Verification email sent! Check your inbox.')
    } catch (error: any) {
      console.error('Resend email error:', error)
      toast.error(`Failed to resend email: ${error.message}`)
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckAgain = async () => {
    if (!user) return

    setIsChecking(true)
    try {
      const status = await checkEmailVerificationStatus()
      setVerificationStatus(status)

      if (status) {
        toast.success('Email verified successfully!')
        navigate('/dashboard')
      } else {
        toast('Email not yet verified. Please check your inbox.', {
          icon: '📧',
          duration: 4000
        })
      }
    } catch (error: any) {
      console.error('Check status error:', error)
      toast.error(`Failed to check status: ${error.message}`)
    } finally {
      setIsChecking(false)
    }
  }

  const handleGoToLogin = () => {
    navigate('/login')
  }

  if (!user && !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verification Required</h1>
            <p className="text-gray-600 mb-6">
              Please log in to verify your email address.
            </p>
            <Button onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
            <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-lg text-gray-600 mb-6">
            We've sent a verification link to <strong>{email}</strong>
          </p>

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} />
            </div>
          )}

          {verificationStatus === true && (
            <div className="mb-6">
              <Alert type="success" message="Email verified successfully! Redirecting to dashboard..." />
            </div>
          )}

          {verificationStatus === false && (
            <div className="mb-6">
              <Alert type="warning" message="Email not yet verified. Please check your inbox and click the verification link." />
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">What to do next:</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>1. Check your email inbox (and spam folder)</li>
                <li>2. Click the "Verify Email" link in the email</li>
                <li>3. You'll be automatically redirected to your dashboard</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleCheckAgain}
                disabled={isChecking}
                variant="outline"
              >
                {isChecking ? 'Checking...' : 'I\'ve Verified My Email'}
              </Button>

              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                variant="outline"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Button>

              <Button
                onClick={handleGoToLogin}
                variant="ghost"
              >
                Back to Login
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              The verification link will expire in 24 hours.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EmailVerificationPage