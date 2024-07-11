import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import dayjs from 'dayjs'
import { getMailClient } from "../lib/mail"
import nodemailer from 'nodemailer'
import { ClientError } from "../errors/client-error"
import { env } from "../env"
 

export async function createTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(3),
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email())
            })
        }
    },async (req) => {
        const {destination, ends_at, starts_at, owner_email, owner_name, emails_to_invite} = req.body

        if(dayjs(starts_at).isBefore(new Date())) {
            throw new ClientError('data inicial menor que a data atual')
        }

        if(dayjs(ends_at).isBefore(starts_at)) {
            throw new ClientError('data final menor que a data inicial')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
                participants: {
                    createMany: {
                        data: [
                            {
                                name: owner_name,
                                email: owner_email,
                                is_owner: true,
                                is_confirmed: true,
                            },
                            ...emails_to_invite.map(email => {
                                return {
                                    email: email,
                                }
                            })

                        ]
                        
                    }
                }
            }
        })

        const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe',
                address: 'email@email.com.br'
            },
            to: {
                name: owner_name,
                address: owner_email,
            },
            subject: 'Testando',
            html: `<p><a href=${confirmationLink}>Confirmar viagem</a></p>`
        })

        console.log(nodemailer.getTestMessageUrl(message))


        return  { tripId: trip.id }
    })
}