import { FastifyInstance } from "fastify"
import { ClientError } from "./errors/client-error"
import { ZodError } from "zod"

type FastifyErrorHandle = FastifyInstance['errorHandler']


export const errorHandle: FastifyErrorHandle = (error, request, reply) => {
    console.log(error)
    if (error instanceof ClientError) {
        return reply.status(400).send({
            message: error.message
        })
    }

    if (error instanceof ZodError) {
        return reply.status(400).send({
            message: 'invalide input',
            errors: error.flatten().fieldErrors
        })
    }

    

    return reply.status(500).send({
        message: "Internal server Error"
    })
}