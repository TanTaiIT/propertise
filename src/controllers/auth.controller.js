import User from '../models/user.model.js'
import { AppError } from '../middlewares/index.js'
import { generateToken, generateRefreshToken, generateRandomString } from '../middlewares/utils/token.js'
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
        `<h2>Hello ${newUser.fullName}</h2>
        <p>Please click this link to active your account.<a href="http://localhost:5000/api/auth/verify-email?token=${emailVerifyToken}">
        Verify Email</a></p>`
    )

    const accessToken = generateToken({ sub: newUser._id })
    const refreshToken = generateRefreshToken({ sub: newUser._id })

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
    RegisterController
}