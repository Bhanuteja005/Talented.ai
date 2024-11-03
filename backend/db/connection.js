import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB");
  } catch (err) {
    console.error("Error connecting to DB:", err);
    process.exit(1); // Exit the process with an error code
  }
};

export default connectDB;
