import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import dayjs from 'dayjs'
import { ClientError } from "../errors/client-error"


export async function createActivity(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
        schema: {
            params: z.object({ tripId: z.string().uuid()}),
            body: z.object({
                title: z.string().min(3),
                occurs_at: z.coerce.date(),
            })
        }
    },async (req) => {
        const { title, occurs_at } = req.body
        const { tripId } = req.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
        })

        if(!trip) { 
            throw new ClientError("TripId not found")
        }

        if(dayjs(occurs_at).isBefore(trip.starts_at)) {
            throw new ClientError('Activity date can not be before trips start date')
        }

        if(dayjs(occurs_at).isAfter(trip.ends_at)) {
            throw new ClientError('Activity date can not be after trips ends date')
        }

        const activity = await prisma.activity.create({
            data: {
                title,
                occurs_at,
                tripId,
            }
        })


        return  { activity: activity.id }
    })
}