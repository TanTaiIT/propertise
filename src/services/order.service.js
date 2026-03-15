import Order from './../models/order.model.js'
import { generateRandomString } from './../middlewares/utils/token.js'
import { AppError } from '../middlewares/index.js'
import UserPackage from './../models/user-package.model.js'
import mongoose from 'mongoose'
import { ORDER_STATUS } from '../config/system.js'
export const createOrder = async ({
    amount,
    note,
    userId,
    listingPackageId
}) => {
    const order = await Order.create({
        orderCode: `ORDER-${generateRandomString()}`,
        amount,
        userId,
        note,
        listingPackageId,
    })

    if(!order) {
        throw AppError.internal('Failed to create order')
    }

    return order
}

export const updateOrderAfterPaymentSuccess = async ({
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
}) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const order = await Order.findOne({ orderCode: vnp_TxnRef }).session(session)

        if(!order) throw AppError.notFound("Order not found")

        // Mark Order Paid
        order.orderStatus = ORDER_STATUS.PAID
        order.paidAt = new Date(vnp_PayDate) // convert to Date object
        await order.save({ session })

        // Get Package Info
        const listingPackage = await ListingPackage.findById(order.listingPackageId).session(session)
        if(!listingPackage) throw AppError.notFound("Listing package not found")

        // Get current package user
        let userPackage = await UserPackage.findOne({
            userId: order.userId,
            listingPackageId: order.listingPackageId
        }).session(session)

        const now = new Date();
        const addedDuration = listingPackage.durationDays * 24 * 60 * 60 * 1000;

        if(!userPackage) {
            // If no have any package, make new one
            userPackage = await UserPackage.create([{
                userId: order.userId,
                listingPackageId: order.listingPackageId,
                startDate: now,
                endDate: new Date(now.getTime() + addedDuration),
                remainingPosts: listingPackage.maxPosts,
                priorityScore: listingPackage.priorityScore
            }], { session });
        } else {
            // if already have one, cong don duration and uu dai
            userPackage.endDate = userPackage.endDate > now
            ? new Date(userPackage.endDate.getTime() + addedDuration)
            : new Date(now.getTime() + addedDuration)
            userPackage.remainingPosts += listingPackage.maxPosts
            userPackage.priorityScore += listingPackage.priorityScore

            await userPackage.save({ session })
        }

        await session.commitTransaction();
        session.endSession();

        return order;
    } catch(error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}