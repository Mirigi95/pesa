const axios = require('axios');

const consumerKey = 'qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW';
const consumerSecret = 'osGQ364R49cXKeOYSpaOnT++rHs=';
const pesapalBaseUrl = 'https://demo.pesapal.com/api/PostPesapalDirectOrderV4/'; // Change to sandbox URL for testing

const TIMEOUT = 90000; // Timeout in milliseconds (e.g., 10 seconds)

// Function to get Pesapal access token
async function getAccessToken() {
    try {
        const response = await axios.post(`${pesapalBaseUrl}oauth2/token`, {
            grant_type: 'client_credentials'
        }, {
            auth: {
                username: consumerKey,
                password: consumerSecret
            },
            timeout: TIMEOUT // Set the timeout here
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.message);
        throw error;
    }
}

// Function to create payment
async function createPayment(amount, currency, email, phone) {
    const accessToken = await getAccessToken();
    try {
        const response = await axios.post(`${pesapalBaseUrl}payment`, {
            amount,
            currency,
            email,
            phone
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            timeout: TIMEOUT // Set the timeout here
        });
        return response.data;
    } catch (error) {
        console.error('Error creating payment:', error.message);
        throw error;
    }
}

module.exports = { createPayment };
