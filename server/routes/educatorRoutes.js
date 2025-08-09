import express from 'express'
import { addCourse, updateRoleToEducator } from '../controllers/educatorController.js'
import upload from '../configs/multer.js'
import { protectEducator } from '../middlewares/AuthMiddleware.js'

const educatorRouter = express.Router()

//add educator role 
educatorRouter.get('/update-role', updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)

export default educatorRouter;