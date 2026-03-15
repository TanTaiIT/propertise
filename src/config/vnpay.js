import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from "vnpay"

const vnpayConfig = new VNPay({
      tmnCode: 'LM38C1CE',
      secureSecret: '4COO4LMET8OG2ZZJ8T2ZOGNC03VL8K58',
      vnpayHost: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: "http://localhost:5000/api/payment/vnpay-return",
      testMode: true,
      loggerFn: ignoreLogger
})

export default vnpayConfig

