import { clerkClient } from '@clerk/express'

//update role to educator

export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        })

        res.json({ success: true, message: 'you can publish a course now' })
    } catch (error) {
        resizeBy.json({ success: false, message: error.message })
    }
}