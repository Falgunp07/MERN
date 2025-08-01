// import { Webhook } from "svix";
// import User from '../models/User.js'

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



import { Webhook } from "svix";
import User from '../models/User.js';

export const clerkWebhooks = async (req, res) => {
  console.log("Webhook received by server!"); // <-- ADDED

  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const payload = JSON.stringify(req.body);
    const headers = {
      "svix-id": req.headers["svix-id"],
      'svix-timestamp': req.headers['svix-timestamp'],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verify the webhook
    whook.verify(payload, headers);

    const { data, type } = req.body;
    console.log(`Webhook successfully verified. Type: ${type}`); // <-- ADDED

    if (type === 'user.created') {
      console.log("Processing 'user.created' event..."); // <-- ADDED
      
      const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        imageUrl: data.image_url,
      };

      console.log("Attempting to create user with this data:", userData); // <-- ADDED

      await User.create(userData);

      console.log("SUCCESS: User should now be in the database."); // <-- ADDED
      
      return res.status(200).json({ success: true, message: 'User created successfully.' });
    }

    // Handle other event types if necessary
    return res.status(200).json({ success: true, message: 'Webhook received, but no action taken for this event type.' });

  } catch (error) {
    console.error("ERROR processing of webhook:", error.message); // <-- ADDED
    return res.status(400).json({ success: false, message: error.message });
  }
};