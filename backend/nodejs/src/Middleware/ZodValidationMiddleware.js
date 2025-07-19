const zodValidationMiddleware = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync(req.body); // req.body is same as the schema validation
        next();
    } catch (err) {
        console.error("Zod validation error:", err);
        
        // Handle Zod validation errors properly
        if (err.errors && Array.isArray(err.errors)) {
            res.status(400).json({
                error: "Validation Error",
                message: err.errors.map((error) => error.message).join(", "),
                details: err.errors,
            });
        } else {
            // Handle other types of validation errors
            res.status(400).json({
                error: "Validation Error",
                message: err.message || "Invalid input data",
                details: err,
            });
        }
    }
}

module.exports = zodValidationMiddleware;