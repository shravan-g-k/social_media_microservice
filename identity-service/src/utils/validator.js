import Joi from "joi";

 function validateRegisterUser(schema) {
    const registerSchema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        password: Joi.string().min(8).max(30).required(),
        email: Joi.string().email().required(),
    });

    return registerSchema.validate(schema);
}
 function validateLoginUser(schema) {
    const loginSchema = Joi.object({
         password: Joi.string().min(8).max(30).required(),
        email: Joi.string().email().required(),
    });

    return loginSchema.validate(schema);
}

export { validateRegisterUser , validateLoginUser};