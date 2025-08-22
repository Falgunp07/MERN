import { clerkClient } from '@clerk/express';
import { v2 as cloudinary } from 'cloudinary';
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';

// Update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const { userId } = req.auth(); // Use correct req.auth()
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        });

        res.json({ success: true, message: 'You can publish a course now' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add new course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body;
        const imageFile = req.file;
        const { userId: educatorId } = req.auth(); // Use correct req.auth()

        if (!imageFile) {
            return res.status(400).json({ success: false, message: 'Thumbnail not attached' });
        }

        const parsedCourseData = JSON.parse(courseData);
        parsedCourseData.educator = educatorId;
        
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
        
        const newCourse = new Course({
            ...parsedCourseData,
            courseThumbnail: imageUpload.secure_url
        });
        
        await newCourse.save();

        res.status(201).json({ success: true, message: 'Course added successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all courses created by a specific educator
export const getEducatorCourses = async (req, res) => {
    try {
        const { userId: educatorId } = req.auth(); // Use correct req.auth()
        const courses = await Course.find({ educator: educatorId });
        res.json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get educator dashboard data
export const educatorDashboardData = async (req, res) => {
    try {
        const { userId: educatorId } = req.auth(); // Use correct req.auth()
        
        // Find all courses by this educator
        const courses = await Course.find({ educator: educatorId });

        if (!courses) {
            return res.json({ success: true, dashboardData: { totalEarnings: 0, enrolledStudentsData: [], totalCourses: 0 } });
        }

        const totalCourses = courses.length;
        const courseIds = courses.map(course => course._id);

        // Find all completed purchases for these courses
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        // Correctly calculate total earnings
        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Get enrolled students data from the purchases
        const enrolledStudentsData = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
        .sort({ createdAt: -1 }) // Sort by most recent
        .limit(5) // Get only the latest 5 for the dashboard
        .populate('userId', 'name imageUrl') // Populate student details
        .populate('courseId', 'courseTitle'); // Populate course title

        const formattedEnrollments = enrolledStudentsData.map(p => ({
            student: p.userId,
            courseTitle: p.courseId.courseTitle
        }));

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudentsData: formattedEnrollments,
                totalCourses
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all students enrolled in any of the educator's courses
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const { userId: educatorId } = req.auth();
        
        const courses = await Course.find({ educator: educatorId });
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
        .populate('userId', 'name imageUrl')
        .populate('courseId', 'courseTitle');

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({ success: true, enrolledStudents });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};