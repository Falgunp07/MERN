import { Webhook } from "svix";
import User from '../models/User.js';
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// --- CLERK WEBHOOK HANDLER ---
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const event = whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      'svix-timestamp': req.headers['svix-timestamp'],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = event;

    if (type === 'user.created') {
      const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        imageUrl: data.image_url,
      };
      await User.create(userData);
      return res.status(201).json({ success: true, message: 'User created.' });
    }
    
    // You can add logic for 'user.updated' and 'user.deleted' here if needed.

    return res.status(200).json({ success: true, message: `Webhook type '${type}' received but not handled.` });

  } catch (error) {
    console.error("Error processing Clerk webhook:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// --- STRIPE WEBHOOK HANDLER ---
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // IMPORTANT: This uses req.body, which must be the RAW body from Express
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { purchaseId } = session.metadata;

        try {
            const purchaseData = await Purchase.findById(purchaseId);
            if (!purchaseData) return res.status(404).json({ message: 'Purchase not found.'});

            const userData = await User.findById(purchaseData.userId);
            const courseData = await Course.findById(purchaseData.courseId);

            // Add course to user's enrolled list
            userData.enrolledCourses.push(courseData._id);
            await userData.save();
            
            // Add user to course's enrolled list
            courseData.enrolledStudents.push(userData._id);
            await courseData.save();

            // Mark the purchase as completed
            purchaseData.status = 'completed';
            await purchaseData.save();

        } catch(error) {
            console.error("Error updating database after purchase:", error);
            return res.status(500).json({ success: false, message: "Error updating database."});
        }
    }
    
    res.json({ received: true });
};