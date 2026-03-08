import { v2 as cloundinary } from 'cloudinary'
import dotenv from 'dotenv';

dotenv.config()
cloundinary.config({
    secure: true,
    cloud_name: process.env.CLOUND_NAME,
    api_key: process.env.API_KEY_CLOUNDINARY,
    api_secret: process.env.API_SECRET_CLOUNDINARY,
})

export default cloundinary
