import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import dayjs from "dayjs"
import nodemailer from 'nodemailer'
import { getMailClient } from "../lib/mail"
import { ClientError } from "../errors/client-error"
import { env } from "../env"



export async function createInvite(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites', {
        schema: {
            params: z.object({ tripId: z.string().uuid()}),
            body: z.object({
                email: z.string().email(),
            })
        }
    },async (req, reply) => {
        const { email } = req.body
        const { tripId } = req.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
        })

        if(!trip) { 
            throw new ClientError("TripId not found")
        }


        const participant = await prisma.participant.create({
            data: {
                email,
                tripId,
            }
        })

        const startDate = dayjs(trip.starts_at)
        const endDate = dayjs(trip.ends_at)

        const mail = await getMailClient()

        
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
        
        // return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`) // esse é para quando tiver o front
        return {redirect: '${env.WEB_BASE_URL}/participants/${participant.id}/confirm'}
    })
}