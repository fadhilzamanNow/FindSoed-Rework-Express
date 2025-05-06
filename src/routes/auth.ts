import express ,{ Request, Response } from "express";
import { PrismaClient } from '../../generated/prisma/client'
import jwt from "jsonwebtoken";
import "dotenv/config"
const router = express.Router()
const prisma = new PrismaClient()


router.use(express.json())

router.get("/", (req : Request, res : Response) => {
    res.send("ENTERING AUTH")
})

router.post("/register", async (req : Request, res : Response) => {

    const {username = null, email = null, password = null, phoneNumber = null } = req.body
   

    if(!username){
        res.status(400).json({
            message : "User tidak disertakan",
            status : false
        })
    }

    if(!email){
        console.log("ga ada email")
        res.status(400).json({
            message : "Email tidak disertakan",
            status : false
        })
    }
    if(!password){
        res.status(400).json({
            message : "Password tidak disertakan",
            status : false
        })
    }

    const findEmail = await prisma.user.findUnique({where : {
        email : email
    }})



    if(findEmail){
        res.status(400).json({
            success : false,
            message : "Email yang kamu masukkan, telah digunakan"
        })
    }else{
        const createUser = await prisma.user.create({
            data : {
                username : req.body.username,
                email : req.body.email,
                password : req.body.password
            }
        })
    
        res.status(201).json({
            success : true,
            message : {
                id : createUser.id,
                username : createUser.username,
                email : createUser.email
            }
        })
    }
    

  

   

})


router.post("/login",async (req: Request, res : Response) => {
    const {email = null, password = null} = req.body
    if(!email){
        res.status(400).json({
            success : false,
            message : "Email tidak disertakan"
        })
    }

    if(!password){
        res.status(400).json({
            success : false,
            message : "Password tidak disertakan"
        })
    }

    const findEmail = await prisma.user.findUnique({
        where : {
            email : email
        }
    })

    if(!findEmail){
        res.status(404).json({
            success : false,
            message : "Email yang kamu masukkan tidak terdaftar"
        })
    }else{
       if(findEmail.password === password){
            const token = jwt.sign({userId : findEmail.id},process.env.JWT_SECRET as string, {expiresIn : '30m'}) 
            res.status(200).json({
                success : true,
                message : "Selamat anda telah berhasil log in",
                token : token
            })
       }else{
        res.status(400).json({
            success : false,
            message : "Password tidak sesuai",
        })
       }
    }
})



export {router as authRouter}