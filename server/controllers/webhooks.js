// import { Webhook } from "svix";
// import User from '../models/User.js'
// import Stripe from "stripe";
// import { request, response } from "express";
// import { Purchase } from "../models/Purchase.js";
// import Course from "../models/Course.js";

// //api controller function to managee clerk user with database

// export const clerkWebhooks = async (req, res) => {
//     try {
//         const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

//         await whook.verify(JSON.stringify(req.body), {
//             "svix-id": req.headers["svix-id"],
//             'svix-timestamp': req.headers['svix-timestamp'],
//             "svix-signature": req.headers["svix-signature"]
//         })
//         const { data, type } = req.body


//         switch (type) {
//             case 'user.created': {
//                 const userData = {
//                     _id: data.id,
//                     email: data.email_addresses[0].email_address,
//                     name: data.first_name + " " + data.last_name,
//                     imageUrl: data.imageUrl,
//                 }
//                 await User.create(userData)
//                 res.json({})
//                 break;
//             }
//             case 'user.updated': {
//                 const userData = {
//                     email: data.email_address[0].email_address,
//                     name: data.first_name + " " + data.last_name,
//                     imageUrl: data.imageUrl,
//                 }
//                 await User.findByIdAndUpdate(data.id, userData)
//                 res.json({})
//                 break;

//             }

//             case 'user.deleted': {
//                 await User.findByIdAndDelete(data.id)
//                 res.json({})
//                 break;
//             }

//             default:
//                 break;

//         }
//     } catch (error) {
//         res.json({ success: false, message: error.message })
//     }

// }
// const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)


// export const stripeWebhooks = async (request, response) => {
//     const sig = request.headers['stripe-signature'];

//     let event;
//     try {
//         event = Stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//     } catch (error) {
//         response.status(400).send(`Webhook Error: ${error.message}`);

//     }
//     // handle the event 
//     switch (event.type) {
//         case 'payment_intent.succeeded': {
//             const paymentIntent = event.data.object;
//             const paymentIntentId = paymentIntent.id;

//             const session = await stripeInstance.checkout.sessions.list({
//                 payment_intent: paymentIntentId
//             })

//             const { purchaseId } = session.data[0].metadata;

//             const purchaseData = await Purchase.findById(purchaseId)
//             const userData = await User.findById(purchaseData.userId)
//             const courseData = await Course.findById(purchaseData.courseId.toString())

//             courseData.enrolledStudents.push(userData)
//             await courseData.save()

//             userData.enrolledCourses.push(courseData._id)
//             await userData.save()


//             purchaseData.status = 'completed'
//             await purchaseData.save()

//             break;
//         }


//         case 'payment_intent.payment_failed': {
//             const paymentMethod = event.data.object;
//             const paymentIntent = event.data.object;
//             const paymentIntentId = paymentIntent.id;

//             const session = await stripeInstance.checkout.sessions.list({
//                 payment_intent: paymentIntentId
//             })

//             const { purchaseId } = session.data[0].metaadata;
//             const purchaseData = await Purchase.findById(purchaseId)
//             purchaseData.status = 'failed'
//             await purchaseData.save()

//             console.log('paymentmethod was attached to a customer');
//             break;
//         }
//         default:
//             console.log(`unhandled event type ${event.type}`);
//     }
//     response.json({ received: true});
// }







import { Webhook } from "svix";
import User from '../models/User.js';
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// --- CLERK WEBHOOK HANDLER ---
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const payload = JSON.stringify(req.body);
    const headers = {
      "svix-id": req.headers["svix-id"],
      'svix-timestamp': req.headers['svix-timestamp'],
      "svix-signature": req.headers["svix-signature"],
    };

    const event = whook.verify(payload, headers);
    const { data, type } = event;

    // Handle the 'user.created' event
    if (type === 'user.created') {
      const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        imageUrl: data.image_url,
      };
      await User.create(userData);
      return res.status(201).json({ success: true, message: 'User created successfully.' });
    }
    
    // Handle the 'user.updated' event
    if (type === 'user.updated') {
        const userData = {
            // FIXED: Corrected typo from 'email_address' to 'email_addresses'
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            imageUrl: data.image_url,
        }
        await User.findByIdAndUpdate(data.id, userData);
        return res.status(200).json({ success: true, message: 'User updated successfully.' });
    }

    // Handle the 'user.deleted' event
    if (type === 'user.deleted') {
        await User.findByIdAndDelete(data.id);
        return res.status(200).json({ success: true, message: 'User deleted successfully.' });
    }

    // For ALL other events, send a success response saying you ignored it.
    return res.status(200).json({ success: true, message: `Webhook type '${type}' received but not handled.` });

  } catch (error) {
    console.error("Error processing Clerk webhook:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};


// --- STRIPE WEBHOOK HANDLER ---
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
    // IMPORTANT: This 'req.body' is the raw body, which is required for verification.
    // This will only work after you make the change to server.js mentioned below.
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Handle the event 
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const { purchaseId } = session.metadata;

            const purchaseData = await Purchase.findById(purchaseId);
            const userData = await User.findById(purchaseData.userId);
            const courseData = await Course.findById(purchaseData.courseId);

            // FIXED: Push the user's ID (string), not the whole user object
            courseData.enrolledStudents.push(userData._id);
            await courseData.save();

            userData.enrolledCourses.push(courseData._id);
            await userData.save();

            purchaseData.status = 'completed';
            await purchaseData.save();
            break;
        }
        case 'checkout.session.async_payment_failed': {
            const session = event.data.object;
            // FIXED: Corrected typo from 'metaadata' to 'metadata'
            const { purchaseId } = session.metadata;
            const purchaseData = await Purchase.findById(purchaseId);
            purchaseData.status = 'failed';
            await purchaseData.save();
            break;
        }
        default:
            console.log(`Unhandled Stripe event type ${event.type}`);
    }
    
    res.json({ received: true });
};