import { Router } from "express"
import { requestPayment, paymentSuccess } from "../controllers/payment.controller.js"
import { authenticate } from "./../middlewares/router/authenticate.js"
import { asyncHandler } from "./../middlewares/index.js"
const paymentRouter = Router()

paymentRouter.post('/request-payment', authenticate, asyncHandler(requestPayment))
paymentRouter.post('/payment-success', asyncHandler(paymentSuccess))
export default paymentRouter