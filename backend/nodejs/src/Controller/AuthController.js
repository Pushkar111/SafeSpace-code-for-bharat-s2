/* AuthController */
const UserModel = require("../Model/UserModel");
const MailUtil = require("../Utils/MailUtil")
const jwtUtil = require("../Utils/JwtUtil")
const EncryptUtil = require("../Utils/EncryptUtil")
const OtpUtil = require("../Utils/OtpUtil")
const SmsUtil = require("../Utils/SmsUtil")

// Helper function to calculate time ago
const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
};

// Authentication middleware for protected routes
const authenticateUser = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        
        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const decoded = jwtUtil.verifyAccessToken(accessToken);
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

// add user + mail
const addUser = async (req, res) => {
    try {
        const { name, email, password, mobile } = req.body;

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // Hash password
        const hashedPassword = EncryptUtil.encryptPassword(password);

        // Create user
        const newUser = await UserModel.create({
            name,
            email,
            password: hashedPassword,
            mobile,
            role: "user"
        });

        // Generate tokens
        const accessToken = jwtUtil.generateAccessToken(newUser._id);
        const refreshToken = jwtUtil.generateRefreshToken(newUser._id);

        // Update user with refresh token
        await UserModel.findByIdAndUpdate(newUser._id, { refreshToken });

        // Send welcome email
        const mailResponse = await MailUtil.mailSend(newUser.email, "welcome mail", "Your account has been created successfully.");
        console.log("mailResponse : ", mailResponse);
        if (!mailResponse) {
            return res.status(500).json({
                success: false,
                message: "Error in sending mail",
                data: {},
            });
        }
        console.log("Mail sent successfully to: ", newUser.email);

        // Set HTTP-only cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// forgetPassword - Enhanced with security token
const forgetPassword = async (req, res) => {
    try {
        console.log("AuthController :: forgetPassword called...");
        
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const foundUser = await UserModel.findOne({ email: email });
        if (!foundUser) {
            // Return success even if user not found for security (prevent email enumeration)
            return res.status(200).json({
                success: true,
                message: "If your email is registered, you will receive a password reset link"
            });
        }

        // Generate password reset token
        const resetToken = jwtUtil.generatePasswordResetToken(foundUser._id);
        
        // Store reset token in user document with expiration (1 hour)
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        await UserModel.findByIdAndUpdate(foundUser._id, {
            passwordResetToken: resetToken,
            passwordResetExpiry: resetTokenExpiry
        });

        // Create secure reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${foundUser.email}`;

        const mailResponse = await MailUtil.mailSend(
            foundUser.email, 
            "Password Reset Request", 
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hi ${foundUser.name},</p>
                <p>You requested to reset your password for your SafeSpace account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    ${resetUrl}
                </p>
            </div>
            `
        );

        if (mailResponse && mailResponse.success) {
            res.status(200).json({
                success: true,
                message: "Password reset link has been sent to your email"
            });
        } else {
            console.error("Failed to send reset email:", mailResponse);
            res.status(500).json({
                success: false,
                message: "Failed to send password reset email. Please try again."
            });
        }
    } catch (error) {
        console.error("Error in forgetPassword:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// resetPassword - Enhanced with token verification
const resetPassword = async (req, res) => {
    try {
        console.log("AuthController :: resetPassword called...");
        
        const { newPassword, token } = req.body;
        const { email } = req.query;
        
        if (!newPassword || !token || !email) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: newPassword, token, and email are required"
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Find user with valid reset token
        const foundUser = await UserModel.findOne({ 
            email: email,
            passwordResetToken: token,
            passwordResetExpiry: { $gt: new Date() } // Token should not be expired
        });

        if (!foundUser) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token"
            });
        }

        // Verify the token
        try {
            const decoded = jwtUtil.verifyPasswordResetToken(token);
            if (decoded.userId !== foundUser._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid password reset token"
                });
            }
        } catch (tokenError) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token"
            });
        }

        // Hash the new password
        const hashedPassword = EncryptUtil.encryptPassword(newPassword);

        // Update user password and clear reset token
        const updatedUser = await UserModel.findByIdAndUpdate(
            foundUser._id, 
            { 
                password: hashedPassword,
                passwordResetToken: undefined,
                passwordResetExpiry: undefined
            }, 
            { new: true }
        );

        if (updatedUser) {
            // Send confirmation email
            await MailUtil.mailSend(
                foundUser.email,
                "Password Successfully Reset",
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Successful</h2>
                    <p>Hi ${foundUser.name},</p>
                    <p>Your SafeSpace account password has been successfully reset.</p>
                    <p>If you didn't make this change, please contact our support team immediately.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/login" 
                           style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Login to Your Account
                        </a>
                    </div>
                    <p>Thank you for using SafeSpace!</p>
                </div>
                `
            );

            res.status(200).json({
                success: true,
                message: "Password reset successfully"
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to update password. Please try again."
            });
        }
    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/* JWT --> Token */
// 1. login with Email + Password
const loginUserWithEmailPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Verify password
        const isPasswordValid = EncryptUtil.comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate tokens
        const accessToken = jwtUtil.generateAccessToken(user._id);
        const refreshToken = jwtUtil.generateRefreshToken(user._id);

        // Update user with refresh token
        await UserModel.findByIdAndUpdate(user._id, { refreshToken });

        // Set HTTP-only cookies with proper configuration for production
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
            domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let browser handle domain
            path: '/'
        };

        res.cookie('accessToken', accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                age: user.age,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                hobbies: user.hobbies,
                bio: user.bio,
                location: user.location,
                isCompleteProfile: user.isCompleteProfile,
                notificationSettings: user.notificationSettings,
                preferredCities: user.preferredCities,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

// 2. login with Mobile + Password
const loginUserWithMobilePassword = async (req, res) => {
    console.log("loginUserWithMobile controller called...");

    const {mobile, password} = req.body;

    // validate
    if (!mobile || !password) {
        return res.status(400).json({
            message: "Mobile and Password are required",
            data: {}
        })
    }

    try {
        const userFromMobile = await UserModel.findOne({mobile: mobile});
        if (!userFromMobile) {
            return res.status(404).json({
                message: "User not found with this mobile number",
                data: {}
            });
        }

        const isPasswordMatch = EncryptUtil.comparePassword(password, userFromMobile.password);
        if (isPasswordMatch) {
            // generate tokens
            const accessToken = jwtUtil.generateAccessToken(userFromMobile._id);
            const refreshToken = jwtUtil.generateRefreshToken(userFromMobile._id);

            // update refreshToken in db
            await userFromMobile.updateOne({refreshToken: refreshToken});

            console.log("Login Successfull with Mobile + Password: ", userFromMobile);

            // Set HTTP-only cookies with proper configuration
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/'
            };

            res.cookie('accessToken', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refreshToken', refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: {
                    id: userFromMobile._id,
                    name: userFromMobile.name,
                    email: userFromMobile.email,
                    mobile: userFromMobile.mobile,
                    role: userFromMobile.role,
                    age: userFromMobile.age,
                    gender: userFromMobile.gender,
                    bloodGroup: userFromMobile.bloodGroup,
                    hobbies: userFromMobile.hobbies,
                    bio: userFromMobile.bio,
                    location: userFromMobile.location,
                    isCompleteProfile: userFromMobile.isCompleteProfile,
                    notificationSettings: userFromMobile.notificationSettings,
                    preferredCities: userFromMobile.preferredCities,
                    profilePic: userFromMobile.profilePic
                }
            });
        } else {
            return res.status(401).json({
                message: "Invalid Credentials!",
                data: {}
            });
        }
    } catch (error) {
        console.log("Error in loginUserWithMobile: ", error)
        return res.status(500).json({
            message: "Internal Server Error in loginUserWithMobile",
            error: error.message
        });
    }
}

// 3. login with Email + OTP --> Generate OTP and send via Email
// - loginUserWithEmailOTP
// - verifyEmailOTP
const loginUserWithEmailOTP = async (req, res) => {
    console.log("loginUserWithEmailOTP controller called...");

    const {email} = req.body;

    // validate
    if (!email) {
        return res.status(400).json({
            message: "Email is required",
            data: {}            
        })
    }

    try {
        const userFromEmail = await UserModel.findOne({email: email})
        if (!userFromEmail) {
            return res.status(404).json({
                message: "User not found with this email",
                data: {}
            });
        }

        // generate 6 digit OTP
        const otp = OtpUtil.generateOTP();

        // store OTP in Redis with TTL of 5 minutes
        const isOtpStored = await OtpUtil.storeOTP(email, otp);
        if (!isOtpStored) {
            return res.status(500).json({
                message: "Error storing OTP in Redis",
                data: {}
            })
        }

        // send OTP via Email
        const mailResponse = await MailUtil.mailSend(
            email, 
            "Login OTP",
            `Your OTP for login is: ${otp}. It is valid for 5 minutes.`
        );

        if (mailResponse && mailResponse.success) {
            return res.status(200).json({
                message: "OTP sent successfully to your email",
                data: {}
            });
        } else {
            return res.status(500).json({
                message: "Error sending OTP via email",
                data: {}
            });
        }
 
    }catch (error) {
        console.error("Error in loginUserWithEmailOTP: ", error);
        return res.status(500).json({
            message: "Internal Server Error in loginUserWithEmailOTP",
            error: error.message
        });
    }
}
// verifyEmailOTP
const verifyEmailOTP = async (req, res) => {
    console.log("verifyEmailOTP controller called...");

    const {email, otp} = req.body;
    // validate
    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required",
            data: {}
        })
    }

    try {
        const verification = await OtpUtil.verifyOTP(email, otp);

        if (verification.valid) {
            const userFromEmail = await UserModel.findOne({email: email});
            if (!userFromEmail) {
                return res.status(404).json({
                    message: "User not found with this email",
                    data: {}
                });
            }

            // generate tokens
            const accessToken = jwtUtil.generateAccessToken(userFromEmail._id);
            const refreshToken = jwtUtil.generateRefreshToken(userFromEmail._id);

            // update refreshToken in db
            await userFromEmail.updateOne({refreshToken: refreshToken});
            console.log("Login Successfull with OTP : ", userFromEmail);

            // Set HTTP-only cookies with proper configuration
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/'
            };

            res.cookie('accessToken', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refreshToken', refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: {
                    id: userFromEmail._id,
                    name: userFromEmail.name,
                    email: userFromEmail.email,
                    mobile: userFromEmail.mobile,
                    role: userFromEmail.role,
                    age: userFromEmail.age,
                    gender: userFromEmail.gender,
                    bloodGroup: userFromEmail.bloodGroup,
                    hobbies: userFromEmail.hobbies,
                    bio: userFromEmail.bio,
                    location: userFromEmail.location,
                    isCompleteProfile: userFromEmail.isCompleteProfile,
                    notificationSettings: userFromEmail.notificationSettings,
                    preferredCities: userFromEmail.preferredCities,
                    profilePic: userFromEmail.profilePic
                }
            });
        }  else {
            return res.status(401).json({
                message: verification.message,
                data: {}
            })
        }
    } catch(error) {
        console.error("Error in verifyEmailOTP: ", error);
        return res.status(500).json({
            message: "Internal Server Error in verifyEmailOTP",
            error: error.message
        });
    }
}

// 4. login with Mobile + OTP --> Generate OTP and send via Mobile
// - loginUserWithMobileOTP
// - verifyMobileOTP
const loginUserWithMobileOTP = async (req, res) => {
    console.log("loginUserWithMobileOTP controller called...");
    const {mobile} =req.body;

    // validate
    if (!mobile) {
        return res.status(400).json({
            message: "Mobile number is required",
            data: {}
        })
    }

    try {
        const userFromMobile = await UserModel.findOne({mobile: mobile});
        if (!userFromMobile) {
            return res.status(404).json({
                message: "User not found with this mobile number",
                data: {}
            });
        }

        // generate 6 digit OTP
        const otp = OtpUtil.generateOTP();

        // store OTP in Redis with TTL of 5 minutes
        const isOtpStored = await OtpUtil.storeOTP(mobile, otp);
        if (!isOtpStored) {
            return res.status(500).json({
                message: "Error storing OTP in Redis",
                data: {}
            })
        }

        // send OTP via SMS
        const smsResponse = await SmsUtil.sendSMS(
            mobile, 
            `Your OTP for login is: ${otp}. It is valid for 5 minutes.`
        );

        if (smsResponse && smsResponse.success) {
            return res.status(200).json({
                message: smsResponse.message,
                data: {}
            });
        } else {
            return res.status(500).json({
                message: "Error sending OTP via SMS",
                data: {error: smsResponse.error}
            });
        }
    } catch (error) {
        console.error("Error in loginUserWithMobileOTP: ", error);
        return res.status(500).json({
            message: "Internal Server Error in loginUserWithMobileOTP",
            error: error.message
        });
    }
}
// verifyMobileOTP
const verifyMobileOTP = async (req, res) => {
    console.log("verifyMobileOTP controller called...");
    const {mobile, otp} = req.body;

    // validate
    if (!mobile || !otp) {
        return res.status(400).json({
            message: "Mobile number and OTP are required",
            data: {}
        })
    }

    try {
        const verification = await OtpUtil.verifyOTP(mobile, otp);
        if (verification.valid) {
            const userFromMobile = await UserModel.findOne({mobile: mobile});
            if (!userFromMobile) {
                return res.status(404).json({
                    message: "User not found with this mobile number",
                    data: {}
                });
            }

            // generate tokens
            const accessToken = jwtUtil.generateAccessToken(userFromMobile._id);
            const refreshToken = jwtUtil.generateRefreshToken(userFromMobile._id);

            // update refreshToken in db
            await userFromMobile.updateOne({refreshToken: refreshToken});

            console.log("Login Successfull with Mobile + OTP: ", userFromMobile);

            // Set HTTP-only cookies with proper configuration
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/'
            };

            res.cookie('accessToken', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refreshToken', refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: {
                    id: userFromMobile._id,
                    name: userFromMobile.name,
                    email: userFromMobile.email,
                    mobile: userFromMobile.mobile,
                    role: userFromMobile.role,
                    age: userFromMobile.age,
                    gender: userFromMobile.gender,
                    bloodGroup: userFromMobile.bloodGroup,
                    hobbies: userFromMobile.hobbies,
                    bio: userFromMobile.bio,
                    location: userFromMobile.location,
                    isCompleteProfile: userFromMobile.isCompleteProfile,
                    notificationSettings: userFromMobile.notificationSettings,
                    preferredCities: userFromMobile.preferredCities,
                    profilePic: userFromMobile.profilePic
                }
            });
        } else {
            return res.status(401).json({
                message: verification.message,
                data: {}
            });
        }
    } catch (error) {
        console.error("Error in verifyMobileOTP: ", error);
        return res.status(500).json({
            message: "Internal Server Error in verifyMobileOTP",
            error: error.message
        });
    }
}



// refreshAccessToken [using refreshToken --> re-login]
const refreshAccessToken = async (req, res) => {
    console.log("refreshAccessToken controller called...");

    const {refreshToken} = req.body;    

    if(refreshToken) {
        try {
            
            // verify refresh token 
            // 1. check it is present in the db
            const userFromRefreshToken = await UserModel.findOne({refreshToken: refreshToken});
            if(userFromRefreshToken) {
                
                // 2. verify the refresh token from the jwtUtil refreshTokens store of set
                const isValidRefreshToken = jwtUtil.verifyAccessToken(refreshToken);
                if(isValidRefreshToken) {
                    // 3. if valid then check if it is not expired
                    const isRefreshTokenExpired = jwtUtil.isTokenExpired(refreshToken);
                    if (isRefreshTokenExpired) {
                        return res.status(401).json({
                            message: "Refresh token expired. Please login again.",
                            code: "REFRESH_TOKEN_EXPIRED"
                        });
                    } else {
                        // 4. generate new access token from the refresh token
                        const newAccessToken = jwtUtil.refreshAccessToken(refreshToken);
                        
                        return res.status(200).json({
                            message: "Access token refreshed successfully",
                            data: {
                                accessToken: newAccessToken
                            }
                        });
                    }

                } else {
                    return res.status(401).json({
                        message: "Invalid refresh token - not verified",
                        code: "INVALID_REFRESH_TOKEN"
                    });
                }

            } else {
                return res.status(401).json({
                    message: "Invalid refresh token - not found in database",
                    code: "INVALID_REFRESH_TOKEN"
                });
            }
            
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Refresh token expired. Please login again.",
                    code: "REFRESH_TOKEN_EXPIRED"
                });
            }
            
            return res.status(401).json({
                message: "Invalid refresh token",
                error: error.message
            });
        }
    } else {
        return res.status(400).json({
            message: "Refresh token is required", 
            data: {}
        })
    }
}


// logoutUser
const logoutUser = async (req, res) => {
    console.log("logoutUser controller called... ");

    const authHeader = req.headers.authorization;
    let accessToken = null;
    const refreshToken = req?.body?.refreshToken; 

    if(authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.split(" ")[1];
    }


    if (accessToken) {
        try {
            // 1. blacklist the access token
            if (jwtUtil.blacklistAccessToken(accessToken)) {
                // 2. check if refresh token is provided, invalidate it as well
                if (refreshToken) {
                    const userFromRefreshToken = await UserModel.findOne({ refreshToken: refreshToken });
                    if (userFromRefreshToken) {
                        // 3. update refreshToken in db with null
                        await userFromRefreshToken.updateOne({ refreshToken: null });
                    } else {
                        return res.status(404).json({
                            message: "User not found for the provided refreshToken",
                            data: {}
                        });
                    }
                } else {
                    // If refresh token is not provided, we still want to update the user's refreshToken in db to null
                    const userFromAccessToken = await UserModel.findOne({_id: jwtUtil.verifyAccessToken(accessToken).userId})
                    if (userFromAccessToken) {
                        await userFromAccessToken.updateOne({ refreshToken: null });
                    } else {
                        return res.status(404).json({
                            message: "User not found for the provided accessToken",
                            data: {}
                        });
                    }
                }
            
                return res.status(200).json({
                    message: "Logout successful",
                    data: {}
                });
            } else {
                return res.status(400).json({
                    message: "Invalid access token",
                    data: {}
                });
            }

        } catch (error) {
            console.error("Error during logout: ", error);
            return res.status(500).json({
                message: "Error during logout",
                data: {}
            });
        }
    } else {
        if (refreshToken) {
            const userFromRefreshToken = await UserModel.findOne({ refreshToken: refreshToken });
            if (userFromRefreshToken) {
                // 3. update refreshToken in db with null
                await userFromRefreshToken.updateOne({ refreshToken: null });

                return res.status(200).json({
                    message: "Logout successful",
                    data: {}
                });
            } else {
                return res.status(404).json({
                    message: "User not found for the provided refreshToken",
                    data: {}
                });
            }
        } else {
            return res.status(400).json({
                message: "accessToken or refreshToken is required for logout",
                data: {}
            });
        }
    }


}

// Enhanced logout with cookie clearing
const enhancedLogoutUser = async (req, res) => {
    try {
        // Clear cookies with proper options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        };

        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);

        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get current user info
const getCurrentUser = async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken;
        
        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "No access token provided"
            });
        }

        // Verify token
        const decoded = jwtUtil.verifyAccessToken(accessToken);
        const user = await UserModel.findById(decoded.userId).select('-password -refreshToken');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                age: user.age,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                hobbies: user.hobbies,
                bio: user.bio,
                location: user.location,
                isCompleteProfile: user.isCompleteProfile,
                notificationSettings: user.notificationSettings,
                preferredCities: user.preferredCities,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        console.error("Auth check error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken;
        
        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const decoded = jwtUtil.verifyAccessToken(accessToken);
        const allowedFields = ['name', 'age', 'gender', 'bloodGroup', 'hobbies', 'mobile', 'preferredCities', 'bio', 'location'];
        
        // Filter only allowed fields from request body
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // Check if profile is complete
        const user = await UserModel.findById(decoded.userId);
        if (updates.age && updates.gender && user.email && user.name) {
            updates.isCompleteProfile = true;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            decoded.userId, 
            updates, 
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                role: updatedUser.role,
                age: updatedUser.age,
                gender: updatedUser.gender,
                bloodGroup: updatedUser.bloodGroup,
                hobbies: updatedUser.hobbies,
                bio: updatedUser.bio,
                location: updatedUser.location,
                isCompleteProfile: updatedUser.isCompleteProfile,
                notificationSettings: updatedUser.notificationSettings,
                preferredCities: updatedUser.preferredCities,
                profilePic: updatedUser.profilePic
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get saved threats
const getSavedThreats = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id).select('savedThreats');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.savedThreats || user.savedThreats.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No saved threats found",
                savedThreats: []
            });
        }
        // Format saved threats with complete information
        const formattedThreats = user.savedThreats.map(threat => {
            // Calculate time ago
            const timeAgo = getTimeAgo(threat.savedAt);
            
            return {
                id: threat.id,
                title: threat.title || "Unknown Threat",
                description: threat.description || "",
                category: threat.category || "general",
                level: threat.level || "medium",
                location: threat.location || "",
                source: threat.source || "Unknown",
                confidence: threat.confidence || 0,
                affectedPeople: threat.affectedPeople || 0,
                coordinates: threat.coordinates || [0, 0],
                aiAdvice: threat.aiAdvice || [],
                savedAt: threat.savedAt,
                originalTimestamp: threat.originalTimestamp,
                timeAgo: timeAgo
            };
        });

        res.status(200).json({
            success: true,
            message: "Saved threats retrieved successfully",
            data: formattedThreats
        });
    } catch (error) {
        console.error("Get saved threats error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching saved threats"
        });
    }
};

// Save threat
const saveThreat = async (req, res) => {
    try {
        const { 
            threatId, 
            title, 
            description, 
            category, 
            level, 
            location, 
            source, 
            confidence, 
            affectedPeople, 
            coordinates, 
            aiAdvice,
            originalTimestamp 
        } = req.body;
        
        if (!threatId) {
            return res.status(400).json({
                success: false,
                message: "Threat ID is required"
            });
        }

        // Check if threat is already saved
        const user = await UserModel.findById(req.user._id);
        const existingThreat = user.savedThreats.find(threat => threat.id === threatId);
        
        if (existingThreat) {
            return res.status(400).json({
                success: false,
                message: "Threat already saved"
            });
        }

        // Create comprehensive threat object
        const threatData = {
            id: threatId,
            title: title || "Unknown Threat",
            description: description || "",
            category: category || "general",
            level: level || "medium",
            location: location || "",
            source: source || "Unknown",
            confidence: confidence || 0,
            affectedPeople: affectedPeople || 0,
            coordinates: coordinates || [0, 0],
            aiAdvice: aiAdvice || [],
            savedAt: new Date(),
            originalTimestamp: originalTimestamp ? new Date(originalTimestamp) : new Date()
        };

        // Add threat to user's saved threats
        await UserModel.findByIdAndUpdate(req.user._id, {
            $addToSet: { 
                savedThreats: threatData
            }
        });

        res.status(200).json({
            success: true,
            message: "Threat saved successfully"
        });
    } catch (error) {
        console.error("Save threat error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Remove saved threat
const removeSavedThreat = async (req, res) => {
    try {
        const { threatId } = req.params;

        // Remove threat from user's saved threats using both id and threatId for compatibility
        const result = await UserModel.findByIdAndUpdate(req.user._id, {
            $pull: { 
                savedThreats: { 
                    $or: [
                        { id: threatId.toString() },
                        { id: parseInt(threatId) }
                    ]
                }
            }
        }, { new: true });

        console.log(`Removed threat ${threatId} for user ${req.user._id}`);

        res.status(200).json({
            success: true,
            message: "Threat removed from saved list"
        });
    } catch (error) {
        console.error("Remove saved threat error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
    try {
        const { settings } = req.body;

        // Update user notification settings
        await UserModel.findByIdAndUpdate(req.user._id, {
            notificationSettings: settings
        });

        res.status(200).json({
            success: true,
            message: "Notification settings updated"
        });
    } catch (error) {
        console.error("Update notification settings error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken;
        
        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        const decoded = jwtUtil.verifyAccessToken(accessToken);
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify current password
        const isCurrentPasswordValid = EncryptUtil.comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const hashedNewPassword = EncryptUtil.encryptPassword(newPassword);

        // Update password
        await UserModel.findByIdAndUpdate(decoded.userId, {
            password: hashedNewPassword
        });

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    addUser,
    forgetPassword,
    resetPassword,
    loginUserWithEmailPassword,
    loginUserWithMobilePassword,
    loginUserWithEmailOTP, verifyEmailOTP,
    loginUserWithMobileOTP, verifyMobileOTP, 
    refreshAccessToken, 
    logoutUser,
    enhancedLogoutUser,
    getCurrentUser,
    updateProfile,
    getSavedThreats,
    saveThreat,
    removeSavedThreat,
    updateNotificationSettings,
    authenticateUser,
    changePassword
}