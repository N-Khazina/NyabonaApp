import axios from 'axios';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp();
const db = admin.firestore();

type PaymentRequestData = {
  phoneNumber: string;
  amount: number;
  paymentMethod: string;
  tripId: string;
};

// ✅ No dotenv — only Firebase Secret Manager
export const initiateMoMoPayment = onCall(
  {
    secrets: ['MOMO_USER_ID', 'MOMO_API_KEY', 'MOMO_SUBSCRIPTION_KEY'],
  },
  async (request) => {
    const data = request.data as PaymentRequestData;
    const { phoneNumber, amount, paymentMethod, tripId } = data;

    if (!phoneNumber || !amount || !paymentMethod || !tripId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required payment parameters.'
      );
    }

    try {
      if (paymentMethod === 'mtn') {
        return await handleMTNMoMoPayment(phoneNumber, amount, tripId);
      } else if (paymentMethod === 'airtel') {
        return await handleAirtelMoneyPayment(phoneNumber, amount, tripId);
      } else {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Unsupported payment method.'
        );
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Payment processing failed.',
        error?.message
      );
    }
  }
);

async function handleMTNMoMoPayment(phone: string, amount: number, tripId: string) {
  const apiUserId = process.env.MOMO_USER_ID;
  const apiKey = process.env.MOMO_API_KEY;
  const subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY;
  const baseURL = 'https://sandbox.momodeveloper.mtn.com/collection/v1_0';

  if (!apiUserId || !apiKey || !subscriptionKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'MTN API credentials are not set in Firebase Secrets.'
    );
  }

  const basicAuth = Buffer.from(`${apiUserId}:${apiKey}`).toString('base64');

  // 1. Get access token
  const tokenRes = await axios.post<{ access_token: string }>(
    `${baseURL.replace('/collection/v1_0', '')}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
    }
  );

  const accessToken = tokenRes.data.access_token;

  // 2. Request payment
  const referenceId = uuidv4();
  const paymentPayload = {
    amount: amount.toString(),
    currency: 'EUR', // ✅ Required for sandbox testing
    externalId: tripId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: phone,
    },
    payerMessage: 'Nyabona trip payment',
    payeeNote: 'Trip fare',
  };

  await axios.post(`${baseURL}/requesttopay`, paymentPayload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': 'sandbox',
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/json',
    },
  });

  // 3. Wait before checking status
  await new Promise((res) => setTimeout(res, 4000));

  const statusRes = await axios.get<{ status: string }>(
    `${baseURL}/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Target-Environment': 'sandbox',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
    }
  );

  const paymentStatus = statusRes.data.status;

  // 4. Store payment info
  await db.collection('payments').doc(referenceId).set({
    tripId,
    phoneNumber: phone,
    amount,
    status: paymentStatus,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentMethod: 'MTN MoMo',
    referenceId,
  });

  // 5. Notify client and driver
  const tripSnap = await db.collection('bookings').doc(tripId).get();
  const tripData = tripSnap.data();

  if (tripData) {
    const { clientId, driverId } = tripData;

    const notify = (to: string, message: string) =>
      db.collection('notifications').add({
        to,
        bookingId: tripId,
        status: paymentStatus === 'SUCCESSFUL' ? 'success' : 'error',
        message,
        senderRole: 'system',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    if (paymentStatus === 'SUCCESSFUL') {
      await Promise.all([
        notify(clientId, 'Payment successful. Driver will now be paid.'),
        notify(driverId, 'Client has completed the payment successfully.'),
      ]);
    } else {
      await Promise.all([
        notify(clientId, 'Payment failed. Please try again.'),
        notify(driverId, 'Client attempted payment but it failed.'),
      ]);
    }
  }

  return {
    success: true,
    message: `MTN MoMo payment ${paymentStatus.toLowerCase()}`,
    status: paymentStatus,
    referenceId,
  };
}

async function handleAirtelMoneyPayment(phone: string, amount: number, tripId: string) {
  return {
    success: true,
    message: 'Airtel Money payment simulation (to be implemented)',
  };
}
