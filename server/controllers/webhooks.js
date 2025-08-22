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
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        console.error("❌ Stripe signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { purchaseId } = session.metadata;

        if (!purchaseId) {
            console.error("❌ No purchaseId in Stripe metadata!");
            return res.status(400).json({ message: "Missing purchaseId in metadata." });
        }

        try {
            const purchase = await Purchase.findById(purchaseId);
            if (!purchase) {
                return res.status(404).json({ message: 'Purchase record not found.'});
            }

            if (purchase.status === 'completed') {
                return res.status(200).json({ message: 'Webhook already processed.' });
            }

            const user = await User.findById(purchase.userId);
            const course = await Course.findById(purchase.courseId);

            if (!user || !course) {
                return res.status(404).json({ message: 'User or Course not found.' });
            }

            // Update database records
            user.enrolledCourses.push(course._id);
            course.enrolledStudents.push(user._id);
            purchase.status = 'completed';

            // Save all changes
            await Promise.all([user.save(), course.save(), purchase.save()]);

            console.log(`✅ Successfully processed purchase: ${purchaseId}`);

        } catch (error) {
            console.error("❌ Error updating database after purchase:", error);
            return res.status(500).json({ success: false, message: "Error updating database." });
        }
    }
    
    res.json({ received: true });
};