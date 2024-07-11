import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import { ClientError } from "../errors/client-error"


export async function getTripDetails(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId', {
        schema: {
            params: z.object({ tripId: z.string().uuid()}),
        }
    },async (req) => {
        const { tripId } = req.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
        })

        if(!trip) { 
            throw new ClientError("TripId not found")
        }

        return  { trip: trip }
    })
}