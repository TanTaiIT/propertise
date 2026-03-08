import bcrypt from 'bcrypt'

export const comparePassword = async (password, passwordHash) => {
    return await bcrypt.compare(password, passwordHash)
}

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10)
}