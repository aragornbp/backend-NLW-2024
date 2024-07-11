import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import dayjs from "dayjs"
import { getMailClient } from "../lib/mail"
import nodemailer from 'nodemailer'
import { ClientError } from "../errors/client-error"
import { env } from "../env"

export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            })
        }
    },async (req, reply) => {
        const { tripId } = req.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
            include: {
                participants: {
                    where: {
                        is_owner: false,
                    }
                }
            }
        })

        if(!trip) { 
            throw new ClientError("TripId not found")
        }

        if (trip.is_confirmed) {
            return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
        }

        await prisma.trip.update({
            where: {
                id: tripId
            },
            data: {
                is_confirmed: true
            },
        })

        const mail = await getMailClient()

        const startDate = dayjs(trip.starts_at)
        const endDate = dayjs(trip.ends_at)

        const promises: Promise<any>[] = []

        for (const participant of trip.participants) {
            const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

            const message = await mail.sendMail({
                from: {
                    name: 'Equipe',
                    address: 'email@email.com.br'
                },
                to: participant.email,
                subject: 'Testando',
                html: `<p><a href=${confirmationLink}>Confirmar viagem</a></p>`
            })
    
            console.log(nodemailer.getTestMessageUrl(message))
            promises.push()
        }

        await Promise.all(promises)

        // return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`) // esse é para quando tiver o front
        return {redirect: '${env.WEB_BASE_URL}/participants/${participant.id}/confirm'}
    })
}