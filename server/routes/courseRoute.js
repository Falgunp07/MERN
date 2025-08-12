import express from 'express'
import { getAllcourse, getCourseId } from '../controllers/courseController.js'

const courseRouter = express.Router()

courseRouter.get('/all', getAllcourse)
courseRouter.get('/:id', getCourseId)

export default courseRouter;