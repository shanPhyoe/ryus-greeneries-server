const express = require('express');
const cors = require('cors');
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const storeItemsAndPrice = require('./storeItems');

app.use(express.json());
app.use(
    cors({
        origin: 'https://ryus-greeneries.netlify.app/checkout',
        methods: 'POST',
    })
);

app.listen(port, error => {
    if (error) throw error;
    console.log('Server running on port ' + port);
});

app.post('/payment', (req, res) => {
    const amount = req.body.items.reduce((total, item) => {
        return storeItemsAndPrice.has(item.id)
            ? total + storeItemsAndPrice.get(item.id)
            : total + 0;
    }, 0);

    const totalQuantity = req.body.items.reduce((total, item) => {
        return storeItemsAndPrice.has(item.id)
            ? total + item.quantity
            : total + 0;
    }, 0);

    // 800 is $8 in cents which is shipping fee for each item
    const totalAmount = amount > 5000 ? amount : amount + totalQuantity * 800;

    const body = {
        source: req.body.token.id,
        amount: totalAmount,
        currency: 'usd',
    };

    stripe.charges.create(body, (stripeError, stripeResponse) => {
        if (stripeError) {
            res.status(500).send({ error: stripeError });
            console.log(stripeError);
        } else {
            res.status(200).send({ success: stripeResponse });
        }
    });
});
