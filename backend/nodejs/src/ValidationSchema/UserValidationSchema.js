const { z } = require("zod");

const UserValidationSchema = z.object({
    name: z.string().min(2, "Name is minimum 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password is minimum 6 characters"), // Changed from 5 to 6 to match frontend
    mobile: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits").optional(), // Added mobile field
    age: z.number().min(1, "Age is minimum 1").max(100, "Age must be less than 100").optional(), // Made optional for signup
    gender: z.string().refine(val => {
        const validGenders = ["male", "female", "other", "prefer-not-to-say"];
        return validGenders.includes(val.toLowerCase());
    }, {
        message: "Gender must be 'male', 'female', 'other', or 'prefer-not-to-say'"
    }).optional(), // Made optional for signup
    isActive: z.boolean().default(true),
    hobbies: z.array(z.string()).optional(), // Made optional for signup
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
        required_error: "Blood group is required",
        invalid_type_error: "Invalid blood group"
    }).optional(), // Made optional for signup
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
    location: z.string().optional(),
    preferredCities: z.array(z.string()).optional(),
    role: z.string().default("user"),
    notificationSettings: z.object({
        email: z.boolean().default(true),
        push: z.boolean().default(true),
        threats: z.boolean().default(true),
        safety: z.boolean().default(true)
    }).optional()
});


// Create a separate schema for signup that only requires essential fields
const SignupValidationSchema = z.object({
    name: z.string().min(2, "Name is minimum 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password is minimum 6 characters"),
    mobile: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits").optional()
});

// Create a schema for profile updates that allows partial updates
const ProfileUpdateValidationSchema = z.object({
    name: z.string().min(2, "Name is minimum 2 characters").optional(),
    age: z.number().min(1, "Age is minimum 1").max(120, "Age must be less than 120").optional(),
    gender: z.string().refine(val => {
        const validGenders = ["male", "female", "other", "prefer-not-to-say"];
        return validGenders.includes(val.toLowerCase());
    }, {
        message: "Gender must be 'male', 'female', 'other', or 'prefer-not-to-say'"
    }).optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
    location: z.string().optional(),
    hobbies: z.array(z.string()).optional(),
    preferredCities: z.array(z.string()).optional(),
    mobile: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits").optional(),
    notificationSettings: z.object({
        email: z.boolean(),
        push: z.boolean(),
        threats: z.boolean(),
        safety: z.boolean()
    }).optional()
});

module.exports = {
    UserValidationSchema,
    SignupValidationSchema,
    ProfileUpdateValidationSchema
};