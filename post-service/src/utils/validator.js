import Joi from "joi";

 function validateCreatePost(schema) {
    const createPostSchema = Joi.object({
        content : Joi.string().min(3).max(5000).required(),
        mediaIds : Joi.array().items(Joi.string()).allow(null),

    });

    return createPostSchema.validate(schema);
} 

export {validateCreatePost}