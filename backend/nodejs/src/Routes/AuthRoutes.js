const router = require("express").Router();
const authController = require("../Controller/AuthController");
const zodValidationMiddleware = require("../Middleware/ZodValidationMiddleware");
const { UserValidationSchema, SignupValidationSchema } = require("../ValidationSchema/UserValidationSchema");
const passport = require("passport");
const jwtUtil = require("../Utils/JwtUtil");
const UserModel = require("../Model/UserModel");

// Registration - with validation (using SignupValidationSchema instead of UserValidationSchema)
router.post("/register", authController.addUser)

// Login routes
// 1. login with Email + Password 
router.post("/login/email-password",  authController.loginUserWithEmailPassword);

// 2. login with Mobile + Password 
router.post("/login/mobile-password", authController.loginUserWithMobilePassword);

// 3. login with Email + OTP 
router.post("/login/email-otp/send",  authController.loginUserWithEmailOTP)
router.post("/login/email-otp/verify", authController.verifyEmailOTP);

// 4. login with Mobile + OTP 
router.post("/login/mobile-otp/send", authController.loginUserWithMobileOTP);
router.post("/login/mobile-otp/verify", authController.verifyMobileOTP);

// 5. Google OAuth Login With Passport
router.get("/google", 
    passport.authenticate("google", { 
        scope: ["profile", "email"] 
    })
);

router.get("/google/callback", 
    passport.authenticate("google", { session: false }),
    async (req, res) => {
        try {
            const user = req.user;
            
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }
            
            // Generate tokens
            const accessToken = jwtUtil.generateAccessToken(user._id);
            const refreshToken = jwtUtil.generateRefreshToken(user._id);
            
            // Update user with refresh token
            await UserModel.findByIdAndUpdate(user._id, { refreshToken });
            
            const cookiesOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-origin cookies in production
                path: '/' // Ensure cookies are accessible across the app
            }

            // Set HTTP-only cookie
            res.cookie('accessToken', accessToken, {
                ...cookiesOptions,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            
            res.cookie('refreshToken', refreshToken, {
                ...cookiesOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            // Redirect to frontend dashboard
            res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
        } catch (error) {
            console.error("Google OAuth callback error:", error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
        }
    }
);

// Token and session management
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/refreshAccessToken", authController.refreshAccessToken);
router.post("/logout", authController.enhancedLogoutUser); 

// Password management
router.post("/forgot-password", authController.forgetPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", authController.changePassword);

// User profile management
router.get("/me", authController.getCurrentUser);
router.put("/profile", authController.updateProfile);

// Saved threats management
router.get("/saved-threats", authController.authenticateUser, authController.getSavedThreats);
router.post("/saved-threats", authController.authenticateUser, authController.saveThreat);
router.delete("/saved-threats/:threatId", authController.authenticateUser, authController.removeSavedThreat);

// Notification settings
router.put("/notifications/settings", authController.authenticateUser, authController.updateNotificationSettings);



module.exports = router;    