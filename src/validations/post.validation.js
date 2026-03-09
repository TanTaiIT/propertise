import { z } from "zod"

export const postSchema = z.object({
    title: z.string("Title is required").max(200, "Title must be less than 200 characters"),
    content: z.string().min(1, "Content is required"),
    summary: z.string().max(500, "Summary must be less than 500 characters").optional(),
    authorName: z.string().min(1, "Author is required").max(100, "Author must be less than 100 characters"),
    authorPhone: z.string().min(1, "Author phone is required").optional(),
    tags: z.preprocess((value) => {
        if(typeof value === 'string') {
            try {
                return JSON.parse(value)
            } catch {
                return []
            }
        }
        return value
    }, z.array(z.string()).default([])),
    location: z.preprocess((value) => {
        if(typeof value === 'string') {
            try {
                return JSON.parse(value)
            } catch {
                return {}
            }
        }
    }, z.object({
        province: z.string().optional(),
        districts: z.string().optional(),
        ward: z.string().optional(),
    })),
    address: z.string().optional(),
    property: z.preprocess((value) => {
        if(typeof value === 'string') {
            try {
                return JSON.parse(value)
            } catch {
                return {}
            }
        }
    }, z.object({
        area: z.number().min(0, "Area must be greater than 0"),
        price: z.number().min(0, "Price must be greater than 0"),
        currency: z.enum(["USD", "VND", "SGD"]).default("VND"),
        width: z.number().min(0, "Width must be greater than 0"),
        length: z.number().min(0, "Length must be greater than 0"),
        bedrooms: z.number().min(0, "Bedrooms must be greater than 0"),
        bathrooms: z.number().min(0, "Bathrooms must be greater than 0"),
    }))
})