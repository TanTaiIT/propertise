import { AppError } from "../middlewares/index.js";
import cloundinary from './../config/cloudinary.js'
import User from './../models/user.model.js'
import { hashPassword } from '../middlewares/utils/common.js'
export const getProfile = (req, res) => {
    const user = req.user

    if(!user) {
        throw AppError.unauthorized('User not found')
    }

    res.status(200).json({
        user
    })

}

// Update Avatar
export const updateAvartar = async (req, res) => {
    const file = req.file
    const upload = await cloundinary.uploader.upload(file.path, {
        folder: "marketplace/posts"
    })

    if(!upload) {
        throw AppError.internal('Fail to upload avatar')
    }

    const imageUrl = upload.secure_url
    
    const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl: imageUrl }, { new: true }).select('-passwordHash')
    if(!user) {
        throw AppError.internal('Fail to update avatar')
    }

    res.status(200).json({
        status: 'success',
        message: 'Avatar updated successfully',
        data: {
            user
        }
    })
}

export const updateProfile = async (req, res) => {
    const { fullName, phone, email, address, role } = req.body
    const user = await User.findByIdAndUpdate(req.user._id, { fullName, phone, email, address, role }, { new: true }).select('-passwordHash')

    if(!user) {
        throw AppError.internal('Fail to update profile')
    }

    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
            user
        }
    })
}

export const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if(!user) {
        throw AppError.unauthorized('User not found')
    }

    const isPasswordValid = await user.comparePassword(currentPassword)
    if(!isPasswordValid) {
        throw AppError.unauthorized('Current password is incorrect')
    }

    const newPasswordHash = await hashPassword(newPassword)
    const updatePassword = await user.updateOne({ passwordHash: newPasswordHash })
    if(!updatePassword) {
        throw AppError.internal('Fail to update password')
    }

    res.status(200).json({
        status: 'success',
        message: 'Password updated successfully',
        data: {
            user
        }
    })

}