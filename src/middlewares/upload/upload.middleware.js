import multer from 'multer'
import path from 'path'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/upload")
    },

    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
        cb(null, uniqueName)
    }
})

export const upload = multer({storage})

// export const uploadFormData = multer({ storage: storage }).fields([
//     { name: 'media', maxCount: 10 },
// ])

export const uploadFormData = () => {
    const storage = multer.memoryStorage()
    return multer({ storage })
}
