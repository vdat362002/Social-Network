import { ErrorHandler } from "../middlewares/index.js";
import Joi from "joi";

const email = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
  .required()
  .messages({
    "string.base": `Email should be a type of 'text'`,
    "string.empty": `Email cannot be an empty field`,
    "string.min": `Email should have a minimum length of {#limit}`,
    "any.required": `Email is a required field.`,
  });

const password = Joi.string().min(8).max(50).required().messages({
  "string.base": `Password should be a type of 'text'`,
  "string.empty": `Password cannot be an empty field`,
  "string.min": `Password should have a minimum length of {#limit}`,
  "any.required": `Password is a required field`,
});

const username = Joi.string().required().messages({
  "string.base": 'Username should be of type "text"',
  "string.empty": `Username cannot be an empty field`,
  "string.min": `Username should have a minimum length of {#limit}`,
  "any.required": "Username field is required",
});
const otp = Joi.string().required().messages({
  "string.base": 'OTP should be of type "text"',
  "string.empty": `OTP cannot be an empty field`,
  "string.length": `OTP should have a length of {#limit}`,
  "any.required": "OTP field is required",
});

export const schemas = {
  loginSchema: Joi.object({
    username,
    password,
  }).options({ abortEarly: false }),
  registerSchema: Joi.object({
    email,
    password,
    username,
  }).options({ abortEarly: false }),
  forgotSchema: Joi.object({
    username,
    password,
    otp,
  }).options({ abortEarly: false }),
  createPostSchema: Joi.object({
    description: Joi.string().allow(""),
    photos: Joi.array().items(Joi.string()),
    privacy: Joi.string().allow(""),
    type_post: Joi.string().allow(""),
  }),

  commentSchema: Joi.object({
    body: Joi.string().required().messages({
      "string.base": 'Comment body should be of type "string"',
      "string.empty": `Comment body cannot be an empty field`,
      "any.required": "Comment body field is required",
    }),
    post_id: Joi.string().allow(""),
    comment_id: Joi.string().allow(""),
  }),

  editProfileSchema: Joi.object({
    firstname: Joi.string().allow(""),
    lastname: Joi.string().allow(""),
    bio: Joi.string().allow(""),
    gender: Joi.string().allow(""),
    birthday: Joi.date().allow(null),
  }),
};

export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.validate(req.body);

    if (result.error) {
      console.log(result.error);
      return next(ErrorHandler(400, result.error.details[0].message));
    } else {
      if (!req.value) {
        req.value = {};
      }
      req.value["body"] = result.value;
      next();
    }
  };
};
