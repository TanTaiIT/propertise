import bcrypt from 'bcrypt'
import cloundinary from '../../config/cloudinary.js'
import streamifier from 'streamifier'
import sharp from 'sharp'

export const comparePassword = async (password, passwordHash) => {
    return await bcrypt.compare(password, passwordHash)
}

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10)
}

export const uploadBuffer = async (file) => {
    const compressedFile = await sharp(file.buffer).resize(1024, 1024).jpeg({quality: 80}).toBuffer()
    return new Promise((resolve, reject) => {
        const stream = cloundinary.uploader.upload_stream(
            { folder: "marketplace/posts" },
            (error, result) => {
                if(result) resolve(result)
                    else reject(error)
            }
        )
        streamifier.createReadStream(compressedFile).pipe(stream)
    })
}