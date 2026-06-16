const Joi = require('joi');

/**
 * Joi validation schemas for all auth endpoints
 * Ensures all request bodies are validated before touching the database
 */

const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required',
    }),

  display_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Display name must be at least 2 characters',
      'any.required': 'Display name is required',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, lowercase letter, and number',
      'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required().messages({
    'any.required': 'Reset token is required',
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
    }),
});

const updateProfileSchema = Joi.object({
  display_name: Joi.string().min(2).max(100).optional(),
  avatar_url: Joi.string().uri().optional().allow('', null),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'New password must contain uppercase, lowercase, and a number',
    }),
});

/**
 * Middleware factory that validates request body against a given schema
 * Returns 400 with validation error messages on failure
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
};
