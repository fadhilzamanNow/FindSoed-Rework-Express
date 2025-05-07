import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { PrismaClient } from "../../generated/prisma";


const router = express.Router();
const prisma = new PrismaClient()

const verifyToken = (req : Request, res : Response, next : NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] 
    try{
        if(token){
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) 
            console.log("hasil decoded : ", decoded);
            //@ts-ignore
            req.userId = decoded.userId
            next()
    }
    }catch(err){
        res.status(401).json({
            success : false,
            message : err
        })
    }   
    }

router.get("/", verifyToken, async (req : Request, res : Response) => {
    try{
        const comment = await prisma.comments.findMany();

        res.status(200).json({
            success : true,
            message : comment
        })
    }catch(err){
        res.status(400).json({
            success : false,
            message : err
        })
    }
})

router.post("/:id", verifyToken, async ( req : Request, res : Response) => {
    try{
        const {message = null} = req.body
        if(message && req.params.id){
            const comments = await prisma.comments.create({
                data : {
                    message : message as string,
                    postId : req.params.id,
                    //@ts-ignore
                    userId : req.userId
                }
            })
        }else{
            throw new Error("Comment belum dimasukkan")
        }
    }catch(err){
        res.status(400).json({
            success : false,
            message :err 
        })
    }
})


router.patch("/:id", verifyToken, async (req :Request, res: Response) => {
    try{
        const {message = null} = req.body


        if(message && req.params.id ){
                const newComments = await prisma.comments.update({
                    where : {
                        //@ts-ignore
                        id : req.params.id
                    },
                    data : {
                        message : message
                    }
                })
                res.status(201).json({
                    success : true,
                    message : newComments
                })
        }
    }catch(err){
        res.status(404).json({
            success : false,
            message : err
        })
    }
})

router.delete("/:id", verifyToken, async (req : Request, res : Response) => {
    try{
        const comments = await prisma.comments.delete({
            where : {
                //@ts-ignore
                id : req.params.id
            },
        })
        res.status(20).json({
            success : true,
            message : "Komen berhasil di delete "
        })
    }catch(err){
        res.status(400).json({
            success : false,
            message : err
        })
    }
})

