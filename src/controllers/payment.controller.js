import vnpayConfig from "../config/vnpay.js"
import { createOrder, updateOrderAfterPaymentSuccess } from "../services/order.service.js"
import { getById } from "../services/listing-package.service.js"
import { AppError } from "../middlewares/index.js"
import UserPackage from "../models/user-package.model.js"
import notificationService from "../services/notification.service.js"
const requestPayment = async (req, res) => {
    const { listingPackageId } = req.body
    const userId = req.user._id
    const packages = await getById(listingPackageId)

    if(!packages) {
        throw AppError.notFound("Package not found")
    }

    const order = await createOrder({ userId, listingPackageId, amount: packages.price })

    const vnpayResponse = await vnpayConfig.buildPaymentUrl({
        vnp_Amount: 100000,
        vnp_IpAddr: req.ip,
        vnp_TxnRef: order.orderCode,
        vnp_OrderInfo: "Thanh toan don hang",
        vnp_OrderType: "other",
        vnp_ReturnUrl: `http://localhost:5000/api/payment/payment-success?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_BankTranNo=VNP15451494&vnp_CardType=ATM&vnp_OrderInfo=Thanh+toan+don+hang&vnp_PayDate=20260315211541&vnp_ResponseCode=00&vnp_TmnCode=LM38C1CE&vnp_TransactionNo=15451494&vnp_TransactionStatus=00&vnp_TxnRef=ORDER-0EB4E41F0E7C487B0966A5BC4D745F0A7B7EF9E03FAFF40D556A1A4191B9EC6C&vnp_SecureHash=a49b0ef0f7e0e09628df3bd234876f1673c198a9648614d08bb0ef71f1d332553404b1b3bc9c1d55225b7a0910873554c30c14e73f2564b9176fe05b7bf35969`
    })
    
    return res.status(200).json(vnpayResponse)
}

const paymentSuccess = async (req, res) => {
    const { vnp_Amount, vnp_BankCode, vnp_BankTranNo, vnp_CardType, vnp_OrderInfo, vnp_PayDate, vnp_ResponseCode, vnp_TmnCode, vnp_TransactionNo, vnp_TransactionStatus, vnp_TxnRef, vnp_SecureHash } = req.query

    // Handle failed payment
    if (vnp_ResponseCode !== '00') {
        // Find the order to get the userId for notification
        const Order = (await import('../models/order.model.js')).default
        const order = await Order.findOne({ orderCode: vnp_TxnRef }).lean()
        if (order) {
            notificationService.notifyOrderFailed({
                recipientId: order.userId,
                orderId: order._id,
                reason: `Payment failed with response code: ${vnp_ResponseCode}. Please try again.`,
            }).catch((err) => console.error("Failed to send order failed notification:", err))
        }
        // Redirect to frontend payment failed page
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/failed?order=${vnp_TxnRef}&code=${vnp_ResponseCode}`)
    }

    const orderUpdate = await updateOrderAfterPaymentSuccess({
        vnp_Amount,
        vnp_BankCode,
        vnp_BankTranNo,
        vnp_CardType,
        vnp_OrderInfo,
        vnp_PayDate,
        vnp_ResponseCode,
        vnp_TmnCode,
        vnp_TransactionNo,
        vnp_TransactionStatus,
        vnp_TxnRef,
        vnp_SecureHash
    })

    // Redirect to frontend payment success page
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?order=${vnp_TxnRef}`)
}

export { requestPayment, paymentSuccess }