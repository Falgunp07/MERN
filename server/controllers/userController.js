import User from "../models/User.js"
import { Purchase } from "../models/Purchase.js";
import Stripe from "stripe";
import Course from "../models/Course.js";
import { CourseProgress } from "../models/CourseProgress.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// user enrolled courses with lecture links
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({ success: true, enrolledCourses: userData.enrolledCourses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


// purchase course
export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body
        const { origin } = req.headers
        const userId = req.auth.userId
        const userData = await User.findById(userId)
        const courseData = await Course.findById(courseId)

        if (!userData || !courseData) {
            res.json({ success: false, message: 'Data not found' })
        }

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        }

        const newPurchase = await Purchase.create(purchaseData)


        // stripe gateway initialize

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
        const currency = process.env.CURRENCY.toLowerCase()

        // creating line items for stripe

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount: Math.floor(newPurchase.amount) * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }

        })
        res.json({ success: true, session_url: session.url })
    } catch (error) {
        res.json({ success: false, error: error.message });

    }
}

// update user Course Progress

export const updateUserCourseProgress = async (req,res) => {
    try {
        const userId = req.auth.userId
        const { courseId, lectureId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'lecture already completed' })
            }
            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        } else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })
        }

        return res.json({ success: true, message: 'Progress Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// get user course progress

export const getUserCourseProgress = async (req, resp) => {
    try {
        const userId = req.auth.userId
        const { courseId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })
        resp.json({ success: true, progressData })
    } catch (error) {
        resp.json({ success: false, message: error.message })
    }
    
}

//add user ratings to course

export const addUserRating = async (req, res) => {
    const userId = req.auth.userId;
    const { courseId, rating } = req.body;
    const user = await User.findById(userId);
    
    if (!courseId || !user || !rating || rating < 1 || rating > 5) {
        res.json({ success: false, message: 'Invalid Details' })
        
    }
    try {
        const course = await Course.findById(courseId);

        if (!course) {
            res.json({ success: false, message: 'course not found' })
            
        }
        const user = await User.findById(userId);
        if (!user || !user.enrolledCourses.includes(courseId)) {
            res.json({ success: false, message: 'user has not purchased the course' })
        }
        
        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)
        
        if(existingRatingIndex > -1){
            course.courseRatings[existingRatingIndex].rating = rating;
        }  else{
            course.courseRatings.push({userId, rating})
        }
        
        await course.save();
        return res.json({success: true, message: 'rating added'})
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}