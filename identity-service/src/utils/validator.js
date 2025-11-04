import Joi from "joi";

export default function validator(schema) {
    const registerSchema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        password: Joi.string().min(8).max(30).required(),
        email: Joi.string().email().required(),
    });

    return registerSchema.validate(schema);
}