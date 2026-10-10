const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addressSchema = new Schema(
  {
    line1: {
      type: String,
      maxlength: 120,
      default: "",
    },
    city: {
      type: String,
      maxlength: 80,
      default: "",
    },
    state: {
      type: String,
      maxlength: 80,
      default: "",
    },
    country: {
      type: String,
      maxlength: 80,
      default: "",
    },
    postalCode: {
      type: String,
      maxlength: 20,
      default: "",
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      maxlength: 20,
      default: null,
    },
    address: {
      type: addressSchema,
      default: undefined,
    },
    profilePictureUrl: {
      type: String,
      default: null,
    },
    profilePicturePublicId: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

const User = mongoose.model("user", userSchema);
module.exports = User;
