import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Event listeners for the connection
    mongoose.connection.on('connected', () => console.log('MongoDB database connected successfully.'));
    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => console.log('MongoDB database disconnected. :('));

    // Attempt to connect to the database
    await mongoose.connect(`${process.env.MONGODB_URI}/Edemy`);

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;