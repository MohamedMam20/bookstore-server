
require('dotenv').config();
const { client }  = require('../config/paypalClient');
const paypal      = require('@paypal/checkout-server-sdk');
const Order       = require('../models/ordersModel');
const FRONT_BASE = process.env.FRONT_BASE


exports.createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;                  
    const order       = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ status: 'fail', message: 'Order already processed' });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId.toString(),         
        amount: {
          currency_code: 'USD',                   
          value: order.totalPrice.toFixed(2)
        }
      }],
      application_context: {
        brand_name:  'BookStoreApp',
        landing_page:'LOGIN',
        user_action: 'PAY_NOW',
        // return_url:  'http://localhost:3000/api/v1/paypal/capture', 
            return_url: `${FRONT_BASE}/paypal`,           

        cancel_url:  'http://localhost:3000/payment-cancelled'
      }
    });

    const resp = await client().execute(request);

    return res.status(200).json({
      status:       'success',
      paypalOrderId: resp.result.id,
      approvalUrl:   resp.result.links.find(l => l.rel === 'approve')?.href
    });
  } catch (err) {
    console.error('PayPal create error:', err);
    res.status(500).json({ status: 'fail', message: 'PayPal order creation failed', error: err.message });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { token } = req.query;                   
    if (!token) return res.status(400).json({ status:'fail', message:'Missing PayPal token' });

    const captureReq = new paypal.orders.OrdersCaptureRequest(token);
    captureReq.requestBody({});

    const capture = await client().execute(captureReq);

    const internalId = capture.result.purchase_units[0].reference_id;

      const updated = await Order.findByIdAndUpdate(
      internalId,
      {
        status: 'paid',
        $push: { statusHistory: { status: 'paid' } }
      },
      { new: true }
    );


    if (!updated) return res.status(404).json({ status:'fail', message:'Internal order not found' });

    res.status(200).json({ status:'success', message:'Payment captured', data: updated });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ status:'fail', message:'Capture failed', error: err.message });
  }
};
