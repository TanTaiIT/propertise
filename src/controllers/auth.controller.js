import User from '../models/user.model.js'
import { AppError } from '../middlewares/index.js'
import { generateToken, generateRefreshToken, verifyRefreshToken, generateRandomString } from '../middlewares/utils/token.js'
import { comparePassword } from '../middlewares/utils/common.js'
import { sendEmail } from '../middlewares/utils/sendEmail.js'

async function RegisterController(req, res) {
    const { email, password, fullName, phone } = req.body
    const isUserExists = await User.findOne({ email })
    if(isUserExists) {
        throw AppError.conflict('User already exists')
    }

    const emailVerifyToken = generateRandomString()
    const emailVerifyTokenExpiry = Date.now() + 1000 * 60 * 60
    const newUser = await User.create({ email, passwordHash: password, fullName, phone, emailVerifyToken, emailVerifyTokenExpiry})
    if(!newUser) {
        throw AppError.internal('Failed to create user')
    }

    await sendEmail(
        newUser.email,
        "Wellcome to our website",
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333333; margin-bottom: 20px;">Hello ${newUser.fullName},</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Welcome to our website! We're excited to have you on board.</p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Please click the button below to verify your account:</p>
                <a href="http://localhost:5000/api/auth/verify-email?token=${emailVerifyToken}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; margin-top: 20px;">Verify Email</a>
                <p style="color: #888888; font-size: 14px; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
            </div>
        </div>`
    )

    const accessToken = generateToken({ sub: newUser._id })
    const refreshToken = generateRefreshToken({ sub: newUser._id })

    // Store refresh token on the user (for revocation support)
    await User.findByIdAndUpdate(newUser._id, { $push: { refreshTokens: refreshToken } })

    res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
            user: newUser,
            accessToken,
            refreshToken
        }
    })
}

async function LoginController(req, res) {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if(!user) {
        throw AppError.unauthorized('email or password is incorrect')
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if(!isPasswordValid) {
        throw AppError.unauthorized('email or password is incorrect')
    }

    const accessToken = generateToken({ sub: user._id })
    const refreshToken = generateRefreshToken({ sub: user._id })

    // Store refresh token on the user (for revocation support)
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } })

    // Update last login timestamp
    user.lastLoginAt = new Date()
    await user.save()

    res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
            user: user,
            accessToken,
            refreshToken
        }
    })
}

async function refreshTokenController(req, res) {
    const { refreshToken } = req.body

    if (!refreshToken) {
        throw AppError.badRequest('Refresh token is required')
    }

    let decoded
    try {
        decoded = verifyRefreshToken(refreshToken)
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw AppError.unauthorized('Refresh token has expired, please login again')
        }
        throw AppError.unauthorized('Invalid refresh token')
    }

    const user = await User.findById(decoded.sub)
    if (!user) {
        throw AppError.unauthorized('User not found')
    }

    if (!user.refreshTokens.includes(refreshToken)) {
        throw AppError.unauthorized('Refresh token has been revoked')
    }

    if (user.status === 'blocked') {
        throw AppError.forbidden('Account is blocked')
    }

    // Token rotation: remove old refresh token and issue new pair
    await User.findByIdAndUpdate(user._id, { $pull: { refreshTokens: refreshToken } })

    const newAccessToken = generateToken({ sub: user._id })
    const newRefreshToken = generateRefreshToken({ sub: user._id })

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: newRefreshToken } })

    res.status(200).json({
        status: 'success',
        message: 'Tokens refreshed successfully',
        data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }
    })
}

async function logoutController(req, res) {
    const { refreshToken } = req.body

    // req.user is the full Mongoose user document (set by authenticate middleware)
    const userId = req.user._id

    if (refreshToken) {
        // Remove the specific refresh token from the user's list
        await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: refreshToken } })
    } else {
        // If no refresh token provided, clear all (full logout from all devices)
        await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } })
    }

    res.status(200).json({
        status: 'success',
        message: 'Logout successful'
    })
}

export async function verifyEmail(req, res) {
    console.log('token', req.query)
    const { token } = req.query
    const userVerified = await User.findOneAndUpdate({
        emailVerifyToken: token,
        emailVerifyTokenExpiry: { $gt: Date.now() },
    },
    {
        isEmailVerify: true,
        emailVerifyToken: null,
        emailVerifyTokenExpiry: null
    },
    { new: true }
)

    if(!userVerified) {
        throw AppError.internal('Token invalid or expired')
    }

    res.status(200).json({
        user: userVerified,
    })

}

export {
    LoginController,
    RegisterController,
    refreshTokenController,
    logoutController
}
