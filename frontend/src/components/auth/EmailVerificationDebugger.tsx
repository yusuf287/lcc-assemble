import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import toast from 'react-hot-toast'

const EmailVerificationDebugger: React.FC = () => {
  const { user, resendEmailVerification, checkEmailVerificationStatus, verifyEmailManually } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null)

  const handleResendEmail = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await resendEmailVerification()
      toast.success('Verification email sent! Check your inbox.')
    } catch (error: any) {
      console.error('Resend email error:', error)
      toast.error(`Failed to resend email: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setIsLoading(true)
    try {
      const status = await checkEmailVerificationStatus()
      setVerificationStatus(status)
      toast.success(`Email verification status: ${status ? 'Verified' : 'Not verified'}`)
    } catch (error: any) {
      console.error('Check status error:', error)
      toast.error(`Failed to check status: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualVerify = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await verifyEmailManually(user.uid)
      toast.success('Email manually verified for testing!')
      // Refresh status
      const status = await checkEmailVerificationStatus()
      setVerificationStatus(status)
    } catch (error: any) {
      console.error('Manual verify error:', error)
      toast.error(`Failed to verify manually: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <Card className="p-4">
        <p className="text-gray-600">Please log in to use email verification debugger.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Email Verification Debugger</h3>
      <p className="text-sm text-gray-600">Debug email verification issues</p>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Current Status:</p>
          <p className={`text-sm ${verificationStatus === null ? 'text-gray-500' : verificationStatus ? 'text-green-600' : 'text-red-600'}`}>
            {verificationStatus === null ? 'Not checked' : verificationStatus ? '✅ Verified' : '❌ Not verified'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCheckStatus}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Check Status
          </Button>

          <Button
            onClick={handleResendEmail}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Resend Email
          </Button>

          <Button
            onClick={handleManualVerify}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
          >
            Manual Verify (Dev Only)
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Debug Info:</strong><br />
            User ID: {user.uid}<br />
            Email: {user.email}<br />
            Display Name: {user.displayName}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default EmailVerificationDebugger