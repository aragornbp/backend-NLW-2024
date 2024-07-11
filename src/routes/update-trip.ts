import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import dayjs from 'dayjs'
import { ClientError } from "../errors/client-error"

export async function updateTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
        schema: {
            params: z.object({tripId: z.string().uuid()}),
            body: z.object({
                destination: z.string().min(3),
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
            })
        }
    },async (req) => {
        const {destination, ends_at, starts_at } = req.body

        const { tripId } = req.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
        })

        if(!trip) { 
            throw new ClientError("TripId not found")
        }

        if(dayjs(starts_at).isBefore(new Date())) {
            throw new ClientError('data inicial menor que a data atual')
        }

        if(dayjs(ends_at).isBefore(starts_at)) {
            throw new ClientError('data final menor que a data inicial')
        }

        await prisma.trip.update({
            where: {
                id: tripId
            },
            data: {
                destination,
                starts_at,
                ends_at,
            }
        })


        return  { trip: trip }
    })
}