// import React from 'react'
// import { assets } from '../../assets/assets'
// import { AppContext } from '../../context/AppContext'
// import { useContext } from 'react'
// import { Link } from 'react-router-dom'



// const CourseCard = ({ course }) => {
//   const { currency,calculateRating } = useContext(AppContext)
//   return (
//     <Link to={'/course/' + course._id} onClick={() => window.scrollTo(0, 0,)} className='border border-gray-500/30 pb-6 overflow-hidden rounded-lg'>
//       <img className='w-full' src={course.courseThumbnail} alt="" />
//       <div className='p-3 text-left'>
//         <h3 className='text-base font-semibold'>{course.courseTitle}</h3>
//         <p className='text-gray-500'>{course.educator.name}</p>
//         <div className='flex items-center space-x-2'>
//           <p>{calculateRating(course)}</p>
//           <div className='flex'>
//             {[...Array(5)].map((_, i) => (<img key={i} src={i < Math.floor(calculateRating(course)) ? assets.star : assets.star_blank} alt='' className='w-3 h-3' />
//             ))}
//           </div>
//           <p className='text-gray-500'>{course.courseRatings.length}</p>
//         </div>
//         <p className='text-base font-semibold text-gray-800'>{currency}{(course.coursePrice - course.discount * course.coursePrice / 100).toFixed(2)}</p>
//       </div>
//     </Link>
//   )
// }

// export default CourseCard


import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext)

  if (!course) return null // safety check in case course itself is null

  return (
    <Link
      to={'/course/' + course?._id}
      onClick={() => window.scrollTo(0, 0)}
      className="border border-gray-500/30 pb-6 overflow-hidden rounded-lg"
    >
      <img className="w-full" src={course?.courseThumbnail || assets.placeholder} alt="" />

      <div className="p-3 text-left">
        <h3 className="text-base font-semibold">{course?.courseTitle || "Untitled Course"}</h3>
        <p className="text-gray-500">{course?.educator?.name || "Unknown Educator"}</p>

        <div className="flex items-center space-x-2">
          <p>{calculateRating(course) || 0}</p>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < Math.floor(calculateRating(course) || 0) ? assets.star : assets.star_blank}
                alt=""
                className="w-3 h-3"
              />
            ))}
          </div>
          <p className="text-gray-500">{course?.courseRatings?.length || 0}</p>
        </div>

        <p className="text-base font-semibold text-gray-800">
          {currency}
          {(course?.coursePrice && course?.discount >= 0)
            ? (course.coursePrice - (course.discount * course.coursePrice) / 100).toFixed(2)
            : "0.00"}
        </p>
      </div>
    </Link>
  )
}

export default CourseCard
