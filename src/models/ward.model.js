import mongoose from "mongoose"

const wardSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            trim: true,
            maxLength: 120
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: 120
        },
    }
)

export default mongoose.model("Ward", wardSchema);